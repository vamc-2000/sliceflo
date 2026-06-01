import React from "react";
import Image from "next/image";
import GeneralNotificationImage from "./generalnotifactionIcon.svg";

interface GeneralNotificationIconProps {
    width?: number;
    height?: number;
}

export const GeneralNotificationIcon: React.FC<GeneralNotificationIconProps> = ({ width = 50, height = 50 }) => {
    return (
        <Image
            src={GeneralNotificationImage}
            alt="General notifications"
            width={width}
            height={height}
            style={{
                objectFit: "contain",
            }}
        />
    );
};
