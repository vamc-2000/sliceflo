// "use client";

// import React, { useState, useEffect } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, X } from "lucide-react";
// import { SelectOne } from "../projects/views/list-view/customFields/SelectOne";
// import { SelectMany } from "../projects/views/list-view/customFields/SelectMany";

// interface FieldModalProps {
//     fieldType: string;
//     isOpen: boolean;
//     onClose: () => void;
//     onSave: (config: any) => void;
//     editingField?: any;
// }

// const FieldModal: React.FC<FieldModalProps> = ({ fieldType, isOpen, onClose, onSave, editingField }) => {
//     const [config, setConfig] = useState<any>({});
//     const [createButtonDisabled, setCreateButtonDisabled] = useState(true);

//     useEffect(() => {
//         if (isOpen && editingField) {
//             setConfig(editingField);
//             setCreateButtonDisabled(false);
//         } else if (!isOpen) {
//             setConfig({});
//             setCreateButtonDisabled(true);
//         }
//     }, [isOpen, editingField]);

//     const handleClose = () => {
//         onClose();
//         setConfig({});
//         setCreateButtonDisabled(true);
//     };

//     // Handle submit from SelectOne component
//     const handleSelectOneSubmit = (data: {
//         name: string;
//         type: 'select-one';
//         description: string;
//         options: string[];
//     }) => {
//         const fieldData = {
//             ...data,
//             type: 'select-one',
//             fieldType: 'select-one'
//         };
        
//         onSave(fieldData);
//         handleClose();
//     };

//     // Handle submit from SelectMany component
//     const handleSelectManySubmit = (data: {
//         name: string;
//         type: 'select-many';
//         description: string;
//         options: string[];
//     }) => {
//         const fieldData = {
//             ...data,
//             type: 'select-many',
//             fieldType: 'select-many'
//         };
        
//         onSave(fieldData);
//         handleClose();
//     };

//     const getFieldTitle = () => {
//         const prefix = editingField ? "Edit" : "Create";
//         switch (fieldType) {
//             case "select-one": return `${prefix} Select One`;
//             case "select-many": return `${prefix} Select Many`;
//             case "date": return `${prefix} Date`;
//             case "text": return `${prefix} Text`;
//             case "number": return `${prefix} Number`;
//             default: return "Create Field";
//         }
//     };

//     // For select-one, render SelectOne directly
//     if (fieldType === 'select-one') {
//         return (
//             <SelectOne
//                 open={isOpen}
//                 onOpenChange={(open) => {
//                     if (!open) {
//                         handleClose();
//                     }
//                 }}
//                 onSubmit={handleSelectOneSubmit}
//                 // initialData={editingField}
//             />
//         );
//     }

//     // For select-many, render SelectMany directly
//     if (fieldType === 'select-many') {
//         return (
//             <SelectMany
//                 open={isOpen}
//                 onOpenChange={(open) => {
//                     if (!open) {
//                         handleClose();
//                     }
//                 }}
//                 onSubmit={handleSelectManySubmit}
//             />
//         );
//     }

//     // For other field types, show placeholder in dialog
//     const renderFieldConfig = () => {
//         switch (fieldType) {
//             case "date":
//                 return <div className="text-sm text-gray-500">Date field - Coming soon</div>;
//             case "text":
//                 return <div className="text-sm text-gray-500">Text field - Coming soon</div>;
//             case "number":
//                 return <div className="text-sm text-gray-500">Number field - Coming soon</div>;
//             default:
//                 return <div className="text-sm text-gray-500">Field type is not implemented yet.</div>;
//         }
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={handleClose}>
//             <DialogContent className="sm:max-w-[420px] rounded-md shadow-lg flex flex-col p-0 max-h-[90vh] border-b-4 border-blue-900">
//                 <DialogHeader className="flex justify-between items-center px-6 py-4 border-b">
//                     <div className="flex items-center gap-3">
//                         <ArrowLeft size={20} className="cursor-pointer hover:text-gray-600" onClick={handleClose} />
//                         <DialogTitle className="text-lg font-semibold">{getFieldTitle()}</DialogTitle>
//                     </div>
//                     <X size={24} className="cursor-pointer text-gray-400 hover:text-gray-600" onClick={handleClose} />
//                 </DialogHeader>
//                 <div className="flex-grow overflow-y-auto p-6">{renderFieldConfig()}</div>
//                 <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
//                     <Button variant="outline" onClick={handleClose} className="text-sm py-2 px-4">
//                         Cancel
//                     </Button>
//                     <Button
//                         variant="default" 
//                         onClick={handleClose}
//                         disabled={createButtonDisabled}
//                         className="text-sm py-2 px-4"
//                     >
//                         Close
//                     </Button>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default FieldModal;
