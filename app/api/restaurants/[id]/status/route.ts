import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise';

interface Restaurant extends RowDataPacket {
  id: string;
  restaurantName: string;
  address: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  panNumber: string;
  panImage: string;
  registrationCertificate: string;
  createdAt: Date;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbPool();
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return new NextResponse('Invalid status value', { status: 400 });
    }

    // First update the status
    const updateQuery = `
      UPDATE restaurants 
      SET status = ?
      WHERE id = ?
    `;
    const [updateResult] = await db.query<ResultSetHeader>(updateQuery, [status, params.id]);

    if (updateResult.affectedRows === 0) {
      return new NextResponse('Restaurant not found', { status: 404 });
    }

    // Then fetch the updated restaurant
    const selectQuery = `
      SELECT 
        id,
        restaurantName,
        address,
        phone,
        status,
        panNumber,
        panImage,
        registrationCertificate,
        createdAt
      FROM restaurants
      WHERE id = ?
    `;
    const [selectResult] = await db.query<Restaurant[] & RowDataPacket[]>(selectQuery, [params.id]);

    if (!selectResult.length) {
      return new NextResponse('Restaurant not found', { status: 404 });
    }

    const updatedRestaurant = selectResult[0];
    return NextResponse.json(updatedRestaurant);
  } catch (error) {
    console.error('[RESTAURANT_STATUS_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
