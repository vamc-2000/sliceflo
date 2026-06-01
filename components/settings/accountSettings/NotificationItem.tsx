import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NotificationItemProps {
    label: string;
    checked?: boolean;
    description?: string;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
    label, 
    checked, 
    description,
    onChange, 
    disabled 
}) => {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center">
                <Switch
                    checked={checked}
                    onCheckedChange={onChange}
                    className="mr-3"
                    aria-label={label}
                    disabled={disabled}
                />
                <Label className="text-sm cursor-pointer font-medium text-[var(--primary)] dark:text-white">
                    {label}
                </Label>
            </div>
            {description && (
                <p className="text-[12px] text-muted-foreground/80 ml-11 leading-tight">
                    {description}
                </p>
            )}
        </div>
    );
};

export default NotificationItem;



// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";

// interface NotificationItemProps {
//     label: string;
//     description?: string;
//     checked?: boolean;
//     onChange?: (checked: boolean) => void;
//     disabled?: boolean;
// }

// export const NotificationItem: React.FC<NotificationItemProps> = ({ 
//     label,
//     description,
//     checked, 
//     onChange, 
//     disabled 
// }) => {
//     return (
//         <div className="space-y-1">
//             <div className="flex items-center">
//                 <Switch
//                     checked={checked}
//                     onCheckedChange={onChange}
//                     className="mr-3"
//                     aria-label={label}
//                     disabled={disabled}
//                 />
//                 <Label className="text-sm cursor-pointer font-medium text-[var(--primary)]">
//                     {label}
//                 </Label>
//             </div>
//             {description && (
//                 <p className="text-xs text-muted-foreground ml-11">
//                     {description}
//                 </p>
//             )}
//         </div>
//     );
// };

// export default NotificationItem;
