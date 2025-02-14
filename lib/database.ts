
import mysql from 'mysql2/promise';

export const getDbPool = async () => {
    const pool = await mysql.createPool({
        host: process.env.Database_Host,
        user: process.env.Database_User,
        password: process.env.Database_Password,
        database: process.env.Database_Name,
        port: parseInt(process.env.DB_PORT || '3000')
    });
    return pool;
};