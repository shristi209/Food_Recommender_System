// import { NextRequest, NextResponse } from 'next/server';
// import { jwtVerify } from 'jose';

// interface JWTPayload {
//     role: string;
//     [key: string]: any;
// }

// export async function middleware(request: NextRequest) {
//     try {
//         const auth_token = request.cookies.get('auth_token')?.value;
//         const currentPath = request.nextUrl.pathname;
//         console.log("auth_token",auth_token)

//         if (!auth_token) {
//             return NextResponse.redirect(new URL('/', request.url));
//         }

//         const secretKey = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
//         const { payload } = await jwtVerify(auth_token, secretKey) as { payload: JWTPayload };

//         const response = NextResponse.next();

//         const roleRoutes: { [key: string]: string } = {
//             'customer': '/admin',
//             'restaurant': '/patientappointment',
//             'admin': '/admin',
//         };

//         const targetRoute = roleRoutes[payload.role];

//         if (payload.role === 'customer') {
//             const pathSegments = currentPath.split('/');
//             const id = payload.id;

//             if (id && pathSegments[2] !== id) {
//                 return NextResponse.redirect(new URL(`/customer/${id}`, request.url));
//             }
//         }

//         if (targetRoute && !currentPath.startsWith(targetRoute)) {
//             return NextResponse.redirect(new URL(targetRoute, request.url));
//         }

//         return response;
//     } catch {
//         return NextResponse.redirect(new URL('/', request.url));
//     }
// }

// export const config = {
//     matcher: [
        
//     ],
// };
