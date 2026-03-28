import { Entity } from "../../../shared/contract";
import { enqueueEntityUpdate } from "./broadcast";

export function queueEntityUpdate(entity: Entity): void {
  enqueueEntityUpdate(entity);
}
