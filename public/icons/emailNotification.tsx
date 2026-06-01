import React from 'react';
interface EmailNotificationIconProps {
    width?: number;
    height?: number;
}

export const EmailNotificationIcon: React.FC<EmailNotificationIconProps> = ({
    width = 50,
    height = 50
}) => {
    return (
        <svg 
            width={width} 
            height={height} 
            viewBox="0 0 50 50" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            xmlnsXlink="http://www.w3.org/1999/xlink"
        >
            <rect width={width} height={height} fill="url(#pattern0_2617_85379)"/>
            <defs>
                <pattern 
                    id="pattern0_2617_85379" 
                    patternContentUnits="objectBoundingBox" 
                    width="1" 
                    height="1"
                >
                    <use xlinkHref="#image0_2617_85379" transform="scale(0.01)"/>
                </pattern>
                <image 
                    id="image0_2617_85379" 
                    width="100" 
                    height="100" 
                    preserveAspectRatio="none" 
                    xlinkHref="data:image/png;base64,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"
                    />
        </defs>
        </svg>
        
    );
};




