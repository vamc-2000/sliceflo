// components/projects/views/list-view/common/FieldTypeSelectContent.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Type,
  AlignLeft,
  Hash,
  Globe,
  Users,
  Mail,
  Phone as PhoneIcon,
  DollarSign,
  Star,
  BarChart3,
  MapPin,
  Wifi,
  Share2,
  Tag,
  ArrowLeft,
  Search,
  ListChecks,
  SquareCheck,
  CalendarCheck,
  SquareCheckBig,
  SquareKanban,
  Copy,
  Shirt,
  FunctionSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects-store";
import { SelectOne } from "../customFields/SelectOne";
import { SelectMany } from "../customFields/SelectMany";
import { Text } from "../customFields/Text";
import { TextArea } from "../customFields/TextArea";
import { Label } from "../customFields/Label";
import { Number } from "../customFields/Number";
import { Website } from "../customFields/Website";
import { Email } from "../customFields/Email";
import { Phone } from "../customFields/Phone";
import { CheckboxField } from "../customFields/Checkbox";
import { DateField } from "../customFields/DateField";
import { BudgetField } from "../customFields/Budget";
import { RatingField } from "../customFields/Rating";
// import { RollupField } from "../customFields/Rollup";
import { VotingField } from "../customFields/Voting";
import { IpAddressField } from "../customFields/IpAddress";
// import { SocialMediaField } from "../customFields/SocialMedia";
// import { AutoNumberField } from "../customFields/AutoNumber";
import { TshirtSizeField } from "../customFields/TshirtSize";
import { FormulaField } from "../customFields/Formula";
import { FieldDifferenceField } from "../customFields/FieldDifference";
import { LocationField } from "../customFields/Location";
import { PeopleField } from "../customFields/People";

// Define field types for Regular and Special tabs
const regularFields = [
  { type: "select-one", label: "Select One", icon: CheckCircle2, color: "text-foreground" },
  { type: "select-many", label: "Select Many", icon: SquareCheck, color: "text-foreground" },
  { type: "text", label: "Text", icon: Type, color: "text-foreground" },
  { type: "textarea", label: "Text area(Long text)", icon: AlignLeft, color: "text-foreground" },
  { type: "label", label: "Label", icon: ListChecks, color: "text-foreground" },
  { type: "date", label: "Date", icon: CalendarCheck, color: "text-foreground" },
  { type: "number", label: "Number", icon: Hash, color: "text-foreground" },
  { type: "website", label: "Website", icon: Globe, color: "text-foreground" },
  { type: "people", label: "People", icon: Users, color: "text-foreground" },
  { type: "email", label: "Email", icon: Mail, color: "text-foreground" },
  { type: "phone", label: "Phone", icon: PhoneIcon, color: "text-foreground" },
  { type: "checkbox", label: "Checkbox", icon: SquareCheckBig, color: "text-foreground" },
];

const specialFields = [
  { type: "budget", label: "Budget", icon: DollarSign, color: "text-foreground" },
  { type: "formula", label: "Formula", icon: FunctionSquare, color: "text-foreground" },
  { type: "rating", label: "Rating", icon: Star, color: "text-foreground" },
  // { type: "rollup", label: "Rollup", icon: BarChart3, color: "text-foreground" },
  { type: "voting", label: "Voting", icon: SquareKanban, color: "text-foreground" },
  { type: "location", label: "Location", icon: MapPin, color: "text-foreground" },
  { type: "ip-address", label: "IP Address", icon: Wifi, color: "text-foreground" },
  // { type: "social-media", label: "Social Media", icon: Share2, color: "text-foreground" },
  // { type: "auto-number", label: "Auto number", icon: Tag, color: "text-foreground" },
  { type: "field-difference", label: "Field Difference", icon: Copy, color: "text-foreground" },
  { type: "tshirt-size", label: "Tshirt size", icon: Shirt, color: "text-foreground" },
];

interface FieldTypeSelectContentProps {
  projectId: string;
  onFieldCreated?: () => void;
  onBack?: () => void;
}

export function FieldTypeSelectContent({ projectId, onFieldCreated, onBack }: FieldTypeSelectContentProps) {
  const { getTaskCustomFields, addTaskCustomField } = useProjectsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"regular" | "special">("regular");
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null);

  const customFields = getTaskCustomFields(projectId);

  // Filter fields based on search query
  const filterFields = (fields: typeof regularFields) => {
    if (!searchQuery) return fields;
    return fields.filter((field) =>
      field.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredRegularFields = filterFields(regularFields);
  const filteredSpecialFields = filterFields(specialFields);

  const handleSelectType = (type: any) => {
    setSelectedFieldType(type);
    setSearchQuery(""); // Clear search
  };

  // back button handler
  const handleBackToList = () => {
    setSelectedFieldType(null);
    setSearchQuery('');
  };

  const handleFieldSubmit = async (data: any) => {
    try {
      // Add custom field with API call
      await addTaskCustomField(projectId, data);

      // Reset and notify parent
      handleBackToList();
      if (onFieldCreated) {
        onFieldCreated();
      }
    } catch (error) {
      console.error('Failed to create custom field:', error);
      alert('Failed to create custom field. Please try again.');
    }
  };

  const handleFieldCancel = () => {
    handleBackToList();
  };

  const currentFields = activeTab === "regular" ? filteredRegularFields : filteredSpecialFields;

  const existingFields = customFields.map(field => {
    console.log('field id check:', field.id, field); // ← add this
    return {
      id: field.id,
      name: field.name,
      type: field.type,
    };
  });

  const getFieldTypeLabel = (type: string) => {
    const allFields = [...regularFields, ...specialFields];
    const field = allFields.find(f => f.type === type);
    return field?.label || type;
  };

  return selectedFieldType ? (
    // SHOW FIELD CONFIGURATION FORM
    <>
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToList}
          className="h-6 w-6 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-xs">
          {getFieldTypeLabel(selectedFieldType)}
        </h3>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedFieldType === 'select-one' && <SelectOne onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'select-many' && <SelectMany onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'text' && <Text onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'textarea' && <TextArea onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'label' && <Label onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'number' && <Number onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'date' && <DateField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'website' && <Website onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'people' && (<PeopleField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />)}
        {selectedFieldType === 'email' && <Email onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'phone' && <Phone onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'checkbox' && <CheckboxField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'budget' && <BudgetField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'formula' && <FormulaField availableFields={existingFields} onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'rating' && <RatingField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {/* {selectedFieldType === 'rollup' && <RollupField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />} */}
        {selectedFieldType === 'voting' && <VotingField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'location' && <LocationField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'ip-address' && <IpAddressField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {/* {selectedFieldType === 'social-media' && <SocialMediaField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'auto-number' && <AutoNumberField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />} */}
        {selectedFieldType === 'field-difference' && <FieldDifferenceField availableFields={existingFields} onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
        {selectedFieldType === 'tshirt-size' && <TshirtSizeField onSubmit={handleFieldSubmit} onCancel={handleFieldCancel} />}
      </div>
    </>
  ) : (
    // SHOW FIELD TYPE LIST
    <>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-6 w-6 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h4 className="text-xs font-semibold">Create field</h4>
      </div>

      <div className="px-4 pt-3 pb-2 border-b flex gap-4">
        <button
          onClick={() => setActiveTab("regular")}
          className={cn(
            "pb-1 text-xs font-medium transition-colors relative",
            activeTab === "regular"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Regular
          {activeTab === "regular" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("special")}
          className={cn(
            "pb-1 text-xs font-medium transition-colors relative",
            activeTab === "special"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Special
          {activeTab === "special" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      <div className="px-4 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fields..."
            className="pl-8 h-8 text-xs border-input bg-muted"
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1 py-1">
        {currentFields.map((field) => {
          const Icon = field.icon;
          return (
            <div
              key={field.type + field.label}
              onClick={() => handleSelectType(field.type)}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted"
            >
              <Icon className={cn("h-4 w-4", field.color)} />
              <span className="text-xs">{field.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
