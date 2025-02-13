"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

interface ConnectionStatus {
    message: string;
    status: number;
    serverTime?: string;
    error?: string;
    diagnostics?: {
        environment: Record<string, string>;
        system: Record<string, string>;
    };
}

const TestDatabaseConnection = () => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
        message: 'Checking database connection...',
        status: 0
    });

    useEffect(() => {
        const checkDatabaseConnection = async () => {
            try {
                const response = await axios.get<ConnectionStatus>('/api/check-db');
                setConnectionStatus({
                    message: response.data.message,
                    status: response.data.status,
                    serverTime: response.data.serverTime,
                    diagnostics: response.data.diagnostics
                });
            } catch (error: any) {
                console.error('Error connecting to database:', error);
                setConnectionStatus({
                    message: 'Database connection failed',
                    status: 500,
                    error: error.response?.data?.message || error.message
                });
            }
        };

        checkDatabaseConnection();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
            
            <div className={`p-4 rounded ${connectionStatus.status === 200 ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className={`font-semibold ${connectionStatus.status === 200 ? 'text-green-800' : 'text-red-800'}`}>
                    {connectionStatus.message}
                </p>
                
                {connectionStatus.serverTime && (
                    <p className="mt-2">Server Time: {connectionStatus.serverTime}</p>
                )}
                
                {connectionStatus.error && (
                    <p className="text-red-600 mt-2">Error: {connectionStatus.error}</p>
                )}
            </div>

            {connectionStatus.diagnostics && (
                <div className="mt-4 bg-gray-100 p-4 rounded">
                    <h2 className="text-lg font-semibold mb-2">Connection Diagnostics</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <h3 className="font-bold">Environment</h3>
                            {Object.entries(connectionStatus.diagnostics.environment).map(([key, value]) => (
                                <p key={key} className="text-sm">
                                    <span className="font-medium">{key}:</span> {value}
                                </p>
                            ))}
                        </div>
                        <div>
                            <h3 className="font-bold">System</h3>
                            {Object.entries(connectionStatus.diagnostics.system).map(([key, value]) => (
                                <p key={key} className="text-sm">
                                    <span className="font-medium">{key}:</span> {value}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestDatabaseConnection;
