import { NextRequest, NextResponse } from 'next/server';
import {getDbPool} from '@/lib/database';
import * as bcrypt from 'bcryptjs';

interface RestaurantRegistration {
    role: 'restaurant';
    restaurantName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    panNumber: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.role || !body.email || !body.password) {
            return NextResponse.json({ 
                message: 'Missing required fields' 
            }, { status: 400 })
        }

        // Connect to the database
        const pool = await getDbPool();
        const sql = pool.request();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(body.password, salt);

        if (body.role === 'customer') {

            
            const checkEmailQuery = `
                SELECT * FROM Users 
                WHERE email = @email AND role = 'customer'
            `;
            
            const checkResult = await sql.query(checkEmailQuery, { 
                email: body.email 
            });

            if (checkResult.recordset.length > 0) {
                return NextResponse.json({ 
                    message: 'Email already registered' 
                }, { status: 409 });
            }

            // Insert customer
            const insertQuery = `
                INSERT INTO Users 
                (name, email, passwordHash, role, createdAt) 
                VALUES 
                (@name, @email, @passwordHash, 'customer', GETDATE())
            `;

            await sql.query(insertQuery, {
                name: customer.name,
                email: customer.email,
                PasswordHash: hashedPassword
            });

            return NextResponse.json({ 
                message: 'Customer registered successfully' 
            }, { status: 201 });

        } else if (body.role === 'RESTAURANT') {
            // Restaurant registration
            const restaurant = body as RestaurantRegistration;
            
            // Check if email already exists
            const checkEmailQuery = `
                SELECT * FROM Users 
                WHERE Email = @Email AND UserRole = 'RESTAURANT'
            `;
            
            const checkResult = await sql.query(checkEmailQuery, { 
                Email: restaurant.email 
            });

            if (checkResult.recordset.length > 0) {
                return NextResponse.json({ 
                    message: 'Restaurant email already registered' 
                }, { status: 409 });
            }

            // Insert restaurant
            const insertQuery = `
                INSERT INTO Users 
                (name, email, passwordHash, role, phone, address, panNumber, createdAt) 
                VALUES 
                (@name, @email, @passwordHash, 'RESTAURANT', @phone, @address, @panNumber, GETDATE())
            `;

            await sql.query(insertQuery, {
                name: restaurant.restaurantName,
                email: restaurant.email,
                passwordHash: hashedPassword,
                phone: restaurant.phone,
                address: restaurant.address,
                panNumber: restaurant.panNumber
            });

            return NextResponse.json({ 
                message: 'Restaurant registered successfully' 
            }, { status: 201 });
        }

        return NextResponse.json({ 
            message: 'Invalid registration type' 
        }, { status: 400 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ 
            message: 'Internal server error', 
            error: error.message 
        }, { status: 500 });
    } finally {
        // Close the database connection
        await sql.close();
    }
}