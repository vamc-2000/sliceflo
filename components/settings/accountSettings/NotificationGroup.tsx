import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface NotificationGroupProps {
    title: string;
    children: React.ReactNode;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
}

export const NotificationGroup: React.FC<NotificationGroupProps> = ({ 
    title, 
    children, 
    checked = false, 
    onCheckedChange, 
    disabled 
}) => {
    return (
        <div className="mb-4 ml-8 mr-4">
            <div className="flex items-center mb-2">
                <Switch
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    className="mr-3"
                    disabled={disabled}
                />
                <Label className="text-sm font-semibold cursor-pointer">
                    {title}
                </Label>
            </div>
            <div className="ml-4">
                {children}
            </div>
        </div>
    );
};

export default NotificationGroup;
