import type { ViewId, DecorationMethod } from "../models/types";

export function baseImagePrompt(args: {
  product_name: string;
  product_type?: string;
  view_id: ViewId;
  decoration_method?: DecorationMethod;
  style_hint?: string;
}) {
  const {
    product_name,
    product_type,
    view_id,
    decoration_method,
    style_hint
  } = args;

  // Vistaprint-like: clean studio shot, no person, consistent lighting.
  return [
    `Create a clean studio product photo for a customizable promotional product.`,
    `Product name: ${product_name}${product_type ? ` (type: ${product_type})` : ""}.`,
    `View: ${view_id}.`,
    decoration_method ? `Decoration method context: ${decoration_method}.` : ``,
    `No person, no hands, no mannequin.`,
    `Plain neutral background, soft shadow, high clarity.`,
    `Make the product angle match the requested view, and frame tightly to show the decoration area clearly.`,
    style_hint ? `Style hint: ${style_hint}` : ``,
  ].filter(Boolean).join(" ");
}

export function enhancePrompt(args: {
  decoration_method: string;
  location: string;
}) {
  const { decoration_method, location } = args;

  return [
    `You are creating a realistic product proof mockup for print production.`,
    `Apply the provided design overlay onto the product image.`,
    `Decoration method: ${decoration_method}.`,
    `Location: ${location}.`,
    `Make the design look physically printed/embroidered/engraved as appropriate (ink texture, stitch texture, or engraving depth).`,
    `Preserve the logo/text faithfully (no changes).`,
    `Maintain realistic lighting, perspective, and material interaction.`,
    `Do not add extra text or watermarks.`,
  ].join(" ");
}
