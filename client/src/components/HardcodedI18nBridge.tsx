import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isHardcodedI18nSource, isRenderedHardcodedTranslation, translateHardcodedText } from "@/lib/hardcoded-i18n";

const translatedTextNodes = new WeakMap<Text, string>();
const translatedAttributes = new WeakMap<Element, Map<string, string>>();
const translatableAttributes = ["placeholder", "title", "aria-label", "aria-description"];
const ignoredTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "CODE", "PRE", "TEXTAREA"]);

function getElementAttributeSources(element: Element): Map<string, string> {
  let sources = translatedAttributes.get(element);
  if (!sources) {
    sources = new Map();
    translatedAttributes.set(element, sources);
  }

  return sources;
}

function shouldIgnoreTextNode(node: Text): boolean {
  const parent = node.parentElement;
  return !parent || ignoredTags.has(parent.tagName);
}

function translateTextNode(node: Text, language: string) {
  if (shouldIgnoreTextNode(node)) return;

  const currentValue = node.nodeValue || "";
  let source = translatedTextNodes.get(node);

  if (!source) {
    if (!isHardcodedI18nSource(currentValue)) return;
    source = currentValue;
    translatedTextNodes.set(node, source);
  } else if (!isRenderedHardcodedTranslation(source, currentValue)) {
    if (!isHardcodedI18nSource(currentValue)) {
      translatedTextNodes.delete(node);
      return;
    }

    source = currentValue;
    translatedTextNodes.set(node, source);
  }

  const translated = translateHardcodedText(source, language);
  if (node.nodeValue !== translated) node.nodeValue = translated;
}

function translateElementAttributes(element: Element, language: string) {
  if (ignoredTags.has(element.tagName)) return;

  const sources = getElementAttributeSources(element);

  for (const attribute of translatableAttributes) {
    const currentValue = element.getAttribute(attribute);
    if (!currentValue) continue;

    let source = sources.get(attribute);
    if (!source) {
      if (!isHardcodedI18nSource(currentValue)) continue;
      source = currentValue;
      sources.set(attribute, source);
    } else if (!isRenderedHardcodedTranslation(source, currentValue)) {
      if (!isHardcodedI18nSource(currentValue)) {
        sources.delete(attribute);
        continue;
      }

      source = currentValue;
      sources.set(attribute, source);
    }

    const translated = translateHardcodedText(source, language);
    if (currentValue !== translated) element.setAttribute(attribute, translated);
  }
}

function translateTree(root: HTMLElement, language: string) {
  translateElementAttributes(root, language);

  const elementWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let element = elementWalker.nextNode() as Element | null;
  while (element) {
    translateElementAttributes(element, language);
    element = elementWalker.nextNode() as Element | null;
  }

  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode() as Text | null;
  while (textNode) {
    translateTextNode(textNode, language);
    textNode = textWalker.nextNode() as Text | null;
  }
}

export function HardcodedI18nBridge() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;

    let frameId = 0;
    const scheduleTranslation = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        translateTree(root, i18n.resolvedLanguage || i18n.language);
      });
    };

    scheduleTranslation();

    const observer = new MutationObserver(scheduleTranslation);
    observer.observe(root, {
      attributes: true,
      attributeFilter: translatableAttributes,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [i18n, language]);

  return null;
}