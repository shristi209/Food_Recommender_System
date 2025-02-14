import { NextResponse } from 'next/server';
import { getDbPool } from '../../../lib/database';

export async function GET() {
    try {
        await getDbPool();

        return NextResponse.json({ 
            message: 'Database connected successfully!', 
            status: 200,
        });
    } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({ 
            message: 'Database connection failed', 
            status: 500,
        }, { status: 500 });
    }
}