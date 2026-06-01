"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { triggerVariables } from "@/stores/automation-store";

interface VariablePickerProps {
    triggerId: string;
    onSelect: (variable: string) => void;
}

const VariablePicker = ({ triggerId, onSelect }: VariablePickerProps) => {
    const variables = triggerVariables[triggerId] || triggerVariables["TASK_CREATED"];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Insert dynamic variable"
                >
                    <Sparkles className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="end">
                <Command>
                    <CommandInput placeholder="Search variables..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No variables found.</CommandEmpty>
                        <CommandGroup heading="Available Fields">
                            {variables.map((v) => (
                                <CommandItem
                                    key={v.value}
                                    value={v.label}
                                    onSelect={() => onSelect(v.value)}
                                    className="cursor-pointer"
                                >
                                    <span className="font-medium">{v.label}</span>
                                    <span className="ml-auto text-[10px] text-gray-400 font-mono">
                                        {v.value}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default VariablePicker;
