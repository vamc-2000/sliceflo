// lib/utils/custom-field-mapper.ts
import { TaskCustomField } from "@/stores/projects-store"
import { CustomFieldAPI, CustomFieldCreateRequest } from "@/lib/api/projects-api";

// Add this mapping at the top of the file
const FRONTEND_TO_API_TYPE: Record<string, string> = {
  'select-one': 'select_one',
  'select-many': 'select_many',
  'ip-address': 'ip_address',
  'social-media': 'social_media_link',
  'auto-number': 'auto_increment',
  'field-difference': 'field_difference',
  'tshirt-size': 'tshirt_size',
  // these match already, but explicit is safer:
  'text': 'text',
  'textarea': 'textarea',
  'number': 'number',
  'date': 'date',
  'checkbox': 'checkbox',
  'website': 'website',
  'people': 'people',
  'email': 'email',
  'phone': 'phone',
  'budget': 'budget',
  'formula': 'formula',
  'rating': 'rating',
  'rollup': 'rollup',
  'voting': 'voting',
  'location': 'location',
  'label': 'labels',
};

const API_TO_FRONTEND_TYPE: Record<string, string> = {
  'select_one': 'select-one',
  'select_many': 'select-many',
  'ip_address': 'ip-address',
  'social_media_link': 'social-media',
  'auto_increment': 'auto-number',
  'field_difference': 'field-difference',
  'tshirt_size': 'tshirt-size',
  'labels': 'label',
};

// Map backend API type to frontend store type
export const mapAPIToStore = (
  apiField: CustomFieldAPI,
  projectId: string
): TaskCustomField => {

  const settings = apiField.settings ?? {};

  // Base fields every type needs
  const base: TaskCustomField = {
    id: apiField._id,
    name: apiField.name,
    projectId,
    type: (API_TO_FRONTEND_TYPE[apiField.type] ?? apiField.type) as any, // ← convert back
    description: apiField.description ?? "",
    required: apiField.required ?? false,
    options: settings.options ?? [],
  };

  // Only add settings fields that are actually present in the API response
  if (settings.defaultValue !== undefined) base.defaultValue = settings.defaultValue;
  if (settings.defaultSelected !== undefined) base.defaultSelected = settings.defaultSelected;
  if (settings.sortOrder !== undefined) base.sortOrder = settings.sortOrder;
  if (settings.numberFormat !== undefined) base.numberFormat = settings.numberFormat;
  if (settings.decimalPlaces !== undefined) base.decimalPlaces = settings.decimalPlaces;
  if (settings.currency !== undefined) base.currency = settings.currency;
  if (settings.customLabel !== undefined) base.customLabel = settings.customLabel;
  if (settings.labelPosition !== undefined) base.labelPosition = settings.labelPosition;
  if (settings.hyperlink !== undefined) base.hyperlink = settings.hyperlink;
  if (settings.emoji !== undefined) {
    // Convert emoji character back to key for the store
    const reverseEmojiMap: Record<string, string> = {
      '😊': 'smile',
      '⭐': 'star',
      '❤️': 'heart',
      '👍': 'thumbs',
      '🔥': 'fire',
    };
    base.emojiType = reverseEmojiMap[settings.emoji] ?? settings.emoji;
  }
  if (settings.emojiType !== undefined) base.emojiType = settings.emojiType; // fallback
  if (settings.emojiNumber !== undefined) base.maxRating = settings.emojiNumber;
  if (settings.maxRating !== undefined) base.maxRating = settings.maxRating;
  if (settings.prefix !== undefined) base.prefix = settings.prefix;
  if (settings.startFrom !== undefined) base.startFrom = settings.startFrom;
  if (settings.relatedTo !== undefined) base.relatedTo = settings.relatedTo;
  if (settings.outputFormat !== undefined) base.outputFormat = settings.outputFormat;
  if (settings.showMembers !== undefined) base.showMembers = settings.showMembers;
  if (settings.showGuests !== undefined) base.showGuests = settings.showGuests;
  if (settings.includeFromTeam !== undefined) base.includeFromTeam = settings.includeFromTeam;
  if (settings.selectedTeams !== undefined) base.selectedTeams = settings.selectedTeams;
  if (apiField.type === 'formula' && settings.field1 && settings.field2) {
    base.expression = {
      field1: settings.field1,
      field2: settings.field2,
      operator: settings.operation ?? '+',
    };
  } else if (settings.expression) {
    base.expression = settings.expression;
  }

  if (apiField.type === 'field_difference' && settings.field1 && settings.field2) {
    base.difference = {
      field1: settings.field1,
      field2: settings.field2,
    };
    base.relatedTo = settings.differenceType;
  }

  return base;
};

// Map frontend store type to backend API request
export const mapStoreToAPI = (storeField: Omit<TaskCustomField, 'id' | 'projectId'>): CustomFieldCreateRequest => {
  // Extract all settings-related fields
  const settings: Record<string, any> = {};

  if (storeField.options) settings.options = storeField.options;
  if (storeField.defaultValue !== undefined) settings.defaultValue = storeField.defaultValue;
  if (storeField.defaultSelected) settings.defaultSelected = storeField.defaultSelected;
  if (storeField.sortOrder) settings.sortOrder = storeField.sortOrder;
  if (storeField.numberFormat) settings.numberFormat = storeField.numberFormat;
  if (storeField.decimalPlaces !== undefined) settings.decimalPlaces = storeField.decimalPlaces;
  if (storeField.currency) settings.currency = storeField.currency;
  if (storeField.customLabel) settings.customLabel = storeField.customLabel;
  if (storeField.labelPosition) settings.labelPosition = storeField.labelPosition;
  if (storeField.hyperlink !== undefined) settings.hyperlink = storeField.hyperlink;
  if (storeField.emojiType) {
    // Convert emoji key to actual emoji character for the API
    const emojiMap: Record<string, string> = {
      smile: '😊',
      star: '⭐',
      heart: '❤️',
      thumbs: '👍',
      fire: '🔥',
    };
    settings.emoji = emojiMap[storeField.emojiType] ?? storeField.emojiType;
  }
  if (storeField.maxRating) settings.emojiNumber = storeField.maxRating;
  if (storeField.prefix) settings.prefix = storeField.prefix;
  if (storeField.startFrom) settings.startFrom = storeField.startFrom;
  if (storeField.expression) {
    settings.field1 = storeField.expression.field1;
    settings.field2 = storeField.expression.field2;
    settings.operation = storeField.expression.operator; // operator → operation
  }
  if (storeField.relatedTo) settings.relatedTo = storeField.relatedTo;
  if (storeField.difference) {
    settings.field1 = storeField.difference.field1;
    settings.field2 = storeField.difference.field2;
    settings.differenceType = storeField.relatedTo; // "date" or "number"
  }
  if (storeField.outputFormat) settings.outputFormat = storeField.outputFormat;
  if (storeField.showMembers !== undefined) settings.showMembers = storeField.showMembers;
  if (storeField.showGuests !== undefined) settings.showGuests = storeField.showGuests;
  if (storeField.includeFromTeam !== undefined) settings.includeFromTeam = storeField.includeFromTeam;
  if (storeField.selectedTeams) settings.selectedTeams = storeField.selectedTeams;
  // if (storeField.multiple !== undefined) settings.multiple = storeField.multiple;

  return {
    name: storeField.name,
    type: FRONTEND_TO_API_TYPE[storeField.type] ?? storeField.type, // ← convert
    description: storeField.description as string | undefined,
    settings: Object.keys(settings).length > 0 ? settings : undefined,
  };
};
