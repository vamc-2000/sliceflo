import React from "react";
import Image from "next/image";
import smartNotificationImage from "./smartNotification.png";

interface SmartNotificationIconProps {
    width?: number;
    height?: number;
}

export const SmartNotifcationIcon: React.FC<SmartNotificationIconProps> = ({ width = 50, height = 50 }) => {
    return (
        <Image
            src={smartNotificationImage}
            alt="Smart notifications"
            width={width}
            height={height}
            style={{
                objectFit: "contain",
            }}
        />
    );
};
