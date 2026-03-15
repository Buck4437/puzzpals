import {
  KeyToCoordinate,
  KeyToPairCoordinate,
  type LayerData,
  type LineObject,
  type ObjectTypes,
  type SurfaceObject,
  type SymbolObject,
  isObjectType,
  isLineObject,
  isSurfaceObject,
  isSymbolObject,
  PairCoordinateToKey,
  CoordinateToKey,
} from "./Grid.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type MessageType = "remove" | "edit";

export interface RemoveMessage {
  messageType: "remove";
  type: ObjectTypes;
  data: string;
}

export interface LineUpdateMessage {
  messageType: "edit";
  type: "lineObjects";
  data: LineObject;
}

export interface SurfaceUpdateMessage {
  messageType: "edit";
  type: "surfaceObjects";
  data: SurfaceObject;
}

export interface SymbolUpdateMessage {
  messageType: "edit";
  type: "symbolObjects";
  data: SymbolObject;
}

export type UpdateMessage =
  | LineUpdateMessage
  | SurfaceUpdateMessage
  | SymbolUpdateMessage;

export type EditMessage = RemoveMessage | UpdateMessage;

function isValidRemoveKey(type: ObjectTypes, value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return type === "lineObjects"
    ? KeyToPairCoordinate(value) !== null
    : KeyToCoordinate(value) !== null;
}

function isValidUpdateData(
  type: ObjectTypes,
  value: unknown,
): value is LineObject | SurfaceObject | SymbolObject {
  switch (type) {
    case "lineObjects":
      return isLineObject(value);
    case "surfaceObjects":
      return isSurfaceObject(value);
    case "symbolObjects":
      return isSymbolObject(value);
  }
}

export function isEditMessage(value: unknown): value is EditMessage {
  if (!isPlainObject(value)) {
    return false;
  }

  return toEditMessage(value.messageType, value.type, value.data) !== null;
}

export function toEditMessage(
  messageType: unknown,
  type: unknown,
  data: unknown,
): EditMessage | null {
  if (!isObjectType(type)) {
    return null;
  }

  if (messageType === "remove") {
    if (!isValidRemoveKey(type, data)) {
      return null;
    }

    return {
      messageType,
      type,
      data,
    } as RemoveMessage;
  }

  if (messageType === "edit") {
    if (!isValidUpdateData(type, data)) {
      return null;
    }

    return {
      messageType,
      type,
      data,
    } as UpdateMessage;
  }

  return null;
}

function applyRemoveMessage(
  layerData: LayerData,
  message: RemoveMessage,
): LayerData {
  const nextLayerData: LayerData = {
    lineObjects: { ...layerData.lineObjects },
    surfaceObjects: { ...layerData.surfaceObjects },
    symbolObjects: { ...layerData.symbolObjects },
  };

  switch (message.type) {
    case "lineObjects":
      if (message.data in nextLayerData.lineObjects) {
        Reflect.deleteProperty(nextLayerData.lineObjects, message.data);
      }
      break;
    case "surfaceObjects":
      if (message.data in nextLayerData.surfaceObjects) {
        Reflect.deleteProperty(nextLayerData.surfaceObjects, message.data);
      }
      break;
    case "symbolObjects":
      if (message.data in nextLayerData.symbolObjects) {
        Reflect.deleteProperty(nextLayerData.symbolObjects, message.data);
      }
      break;
  }

  return nextLayerData;
}

function applyUpdateMessage(
  layerData: LayerData,
  message: UpdateMessage,
): LayerData {
  const nextLayerData: LayerData = {
    lineObjects: { ...layerData.lineObjects },
    surfaceObjects: { ...layerData.surfaceObjects },
    symbolObjects: { ...layerData.symbolObjects },
  };

  switch (message.type) {
    case "lineObjects": {
      const key = PairCoordinateToKey([message.data.start, message.data.end]);
      nextLayerData.lineObjects[key] = message.data;
      break;
    }
    case "surfaceObjects": {
      const key = CoordinateToKey(message.data.location);
      nextLayerData.surfaceObjects[key] = message.data;
      break;
    }
    case "symbolObjects": {
      const key = CoordinateToKey(message.data.location);
      nextLayerData.symbolObjects[key] = message.data;
      break;
    }
  }

  return nextLayerData;
}

export function applyEditMessage(
  layerData: LayerData,
  message: EditMessage,
): LayerData {
  if (message.messageType === "remove") {
    return applyRemoveMessage(layerData, message);
  }
  return applyUpdateMessage(layerData, message);
}

function cloneLineObject(value: LineObject): LineObject {
  return {
    start: [...value.start] as typeof value.start,
    end: [...value.end] as typeof value.end,
    color: value.color,
  };
}

function cloneSurfaceObject(value: SurfaceObject): SurfaceObject {
  return {
    location: [...value.location] as typeof value.location,
    color: value.color,
  };
}

function cloneSymbolObject(value: SymbolObject): SymbolObject {
  return {
    location: [...value.location] as typeof value.location,
    content: value.content,
    color: value.color,
  };
}

function getExistingObject(
  layerData: LayerData,
  type: ObjectTypes,
  key: string,
): LineObject | SurfaceObject | SymbolObject | null {
  switch (type) {
    case "lineObjects":
      return layerData.lineObjects[key] ?? null;
    case "surfaceObjects":
      return layerData.surfaceObjects[key] ?? null;
    case "symbolObjects":
      return layerData.symbolObjects[key] ?? null;
  }
}

function cloneExistingObject(
  value: LineObject | SurfaceObject | SymbolObject,
): LineObject | SurfaceObject | SymbolObject {
  if ("start" in value) {
    return cloneLineObject(value);
  }

  if ("content" in value) {
    return cloneSymbolObject(value);
  }

  return cloneSurfaceObject(value);
}

function getUpdateKey(message: UpdateMessage): string {
  switch (message.type) {
    case "lineObjects":
      return PairCoordinateToKey([message.data.start, message.data.end]);
    case "surfaceObjects":
      return CoordinateToKey(message.data.location);
    case "symbolObjects":
      return CoordinateToKey(message.data.location);
  }
}

export function createInverseEditMessage(
  layerData: LayerData,
  message: EditMessage,
): EditMessage | null {
  if (message.messageType === "remove") {
    const existingObject = getExistingObject(
      layerData,
      message.type,
      message.data,
    );
    if (existingObject === null) {
      return null;
    }

    return {
      messageType: "edit",
      type: message.type,
      data: cloneExistingObject(existingObject),
    } as UpdateMessage;
  }

  const key = getUpdateKey(message);
  const existingObject = getExistingObject(layerData, message.type, key);
  if (existingObject === null) {
    return {
      messageType: "remove",
      type: message.type,
      data: key,
    };
  }

  return {
    messageType: "edit",
    type: message.type,
    data: cloneExistingObject(existingObject),
  } as UpdateMessage;
}
