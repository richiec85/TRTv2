import React from 'react';

interface EmptyProps {
    msg?: string;
}

const Empty: React.FC<EmptyProps> = ({ msg = 'No data yet' }) => {
    return (
        <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--muted)',
            fontSize: 13,
        }}>
            {msg}
        </div>
    );
};

export default Empty;