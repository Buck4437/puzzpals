import {
  KeyToCoordinate,
  KeyToPairCoordinate,
  type ShapeObject,
  type LayerData,
  type LineObject,
  type ObjectTypes,
  type SurfaceObject,
  type TextObject,
  isObjectType,
  isShapeObject,
  isLineObject,
  isSurfaceObject,
  isTextObject,
  PairCoordinateToKey,
  CoordinateToKey,
  NormalizePairCoordinates,
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

export interface TextUpdateMessage {
  messageType: "edit";
  type: "textObjects";
  data: TextObject;
}

export interface ShapeUpdateMessage {
  messageType: "edit";
  type: "shapeObjects";
  data: ShapeObject;
}

export type UpdateMessage =
  | LineUpdateMessage
  | SurfaceUpdateMessage
  | TextUpdateMessage
  | ShapeUpdateMessage;

export type EditMessage = RemoveMessage | UpdateMessage;

export function getTextEditCoordinateKey(message: EditMessage): string | null {
  if (message.type !== "textObjects") {
    return null;
  }

  if (message.messageType === "remove") {
    return message.data;
  }

  return CoordinateToKey(message.data.location);
}

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
): value is LineObject | SurfaceObject | TextObject | ShapeObject {
  switch (type) {
    case "lineObjects":
      return isLineObject(value);
    case "surfaceObjects":
      return isSurfaceObject(value);
    case "textObjects":
      return isTextObject(value);
    case "shapeObjects":
      return isShapeObject(value);
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
    textObjects: { ...layerData.textObjects },
    shapeObjects: { ...layerData.shapeObjects },
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
    case "textObjects":
      if (message.data in nextLayerData.textObjects) {
        Reflect.deleteProperty(nextLayerData.textObjects, message.data);
      }
      break;
    case "shapeObjects":
      if (message.data in nextLayerData.shapeObjects) {
        Reflect.deleteProperty(nextLayerData.shapeObjects, message.data);
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
    textObjects: { ...layerData.textObjects },
    shapeObjects: { ...layerData.shapeObjects },
  };

  switch (message.type) {
    case "lineObjects": {
      const key = PairCoordinateToKey(message.data.endpoints);
      const endpoints = NormalizePairCoordinates(message.data.endpoints);
      nextLayerData.lineObjects[key] = {
        ...message.data,
        endpoints,
      };
      break;
    }
    case "surfaceObjects": {
      const key = CoordinateToKey(message.data.location);
      nextLayerData.surfaceObjects[key] = message.data;
      break;
    }
    case "textObjects": {
      const key = CoordinateToKey(message.data.location);
      nextLayerData.textObjects[key] = message.data;
      break;
    }
    case "shapeObjects": {
      const key = CoordinateToKey(message.data.location);
      nextLayerData.shapeObjects[key] = message.data;
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
    endpoints: value.endpoints.map(
      (coord) => [...coord] as typeof coord,
    ) as typeof value.endpoints,
    color: value.color,
    thickness: value.thickness,
  };
}

function cloneSurfaceObject(value: SurfaceObject): SurfaceObject {
  return {
    location: [...value.location] as typeof value.location,
    color: value.color,
  };
}

function cloneTextObject(value: TextObject): TextObject {
  return {
    location: [...value.location] as typeof value.location,
    content: value.content,
    color: value.color,
  };
}

function cloneShapeObject(value: ShapeObject): ShapeObject {
  return {
    location: [...value.location] as typeof value.location,
    content: value.content,
  };
}

function getExistingObject(
  layerData: LayerData,
  type: ObjectTypes,
  key: string,
): LineObject | SurfaceObject | TextObject | ShapeObject | null {
  switch (type) {
    case "lineObjects":
      return layerData.lineObjects[key] ?? null;
    case "surfaceObjects":
      return layerData.surfaceObjects[key] ?? null;
    case "textObjects":
      return layerData.textObjects[key] ?? null;
    case "shapeObjects":
      return layerData.shapeObjects[key] ?? null;
  }
}

function cloneExistingObject(
  value: LineObject | SurfaceObject | TextObject | ShapeObject,
): LineObject | SurfaceObject | TextObject | ShapeObject {
  if ("endpoints" in value) {
    return cloneLineObject(value);
  }

  if ("content" in value && "color" in value) {
    return cloneTextObject(value);
  }

  if ("content" in value) {
    return cloneShapeObject(value);
  }

  return cloneSurfaceObject(value);
}

function getUpdateKey(message: UpdateMessage): string {
  switch (message.type) {
    case "lineObjects":
      return PairCoordinateToKey(message.data.endpoints);
    case "surfaceObjects":
      return CoordinateToKey(message.data.location);
    case "textObjects":
      return CoordinateToKey(message.data.location);
    case "shapeObjects":
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
