import { getDbPool } from "@/lib/database";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    let requestData: any = {};
    let isFormData = false;

    // Check content type
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        // Parse JSON data
        requestData = await request.json();
    } else if (contentType.includes("multipart/form-data")) {
        // Handle FormData
        const formData = await request.formData();
        isFormData = true;

        // Convert FormData into a JSON-like object
        requestData = Object.fromEntries(formData.entries());

        // Extract files
        requestData.registrationCertificate = formData.get("registrationCertificate");
        requestData.panImage = formData.get("panImage");
    }

    const {
        role,
        name,
        email,
        password,
        restaurantName,
        phone,
        address,
        panNumber,
        registrationCertificate,
        panImage,
        status = 'pending'
    } = requestData;

    console.log("Received Data:", requestData);

    // Validate required fields
    if (!role || !email || !password) {
        return new Response(JSON.stringify({
            message: "Missing required fields",
            field: "general"
        }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (role === "restaurant" && (!restaurantName || !phone || !address)) {
        return new Response(JSON.stringify({
            message: "Missing required restaurant fields",
            field: "restaurant"
        }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const pool = await getDbPool();

        // Check if email exists
        const [existingUsers] = await pool.execute("SELECT * FROM Users WHERE email = ?", [email]);

        if ((existingUsers as any[]).length > 0) {
            return new Response(JSON.stringify({
                message: "Email is already in use. Please try a different email.",
                field: "email"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Start transaction
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert user
            const [userResult] = await connection.execute(
                "INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)",
                [name || restaurantName, email, hashedPassword, role]
            );

            const userId = (userResult as any).insertId;

            // If restaurant, insert extra fields
            if (role === "restaurant") {
                await connection.execute(
                    "INSERT INTO Restaurants (userId, restaurantName, phone, address, panNumber, registrationCertificate, panImage, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        userId,
                        restaurantName || null, 
                        phone || null, 
                        address || null, 
                        panNumber || null, 
                        registrationCertificate ? registrationCertificate.name : null, 
                        panImage ? panImage.name : null, 
                        status || 'pending'  
                    ]
                );
            }

            // Commit transaction
            await connection.commit();

            return new Response(JSON.stringify({
                success: true,
                message: "Registration successful",
                redirectUrl: "/login"
            }), { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (insertError) {
            await connection.rollback();
            console.error("Registration insert error:", insertError);
            return new Response(JSON.stringify({
                message: "Registration failed",
                error: insertError instanceof Error ? insertError.message : 'Unknown error'
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Registration error:", error);
        return new Response(JSON.stringify({
            message: "Registration failed",
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
