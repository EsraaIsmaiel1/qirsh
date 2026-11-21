/**
 * Drop-in replacements for React Native's Text and TextInput that set the brand
 * font, Readex Pro. React Native has no global font setting, and a custom font
 * needs one family per weight, so these map each style's fontWeight to the
 * matching Readex Pro file (loaded in RootNavigation).
 *
 * Styles keep using fontWeight as usual. A style with its own non-Readex
 * fontFamily (e.g. 'monospace' for wallet IDs) is left alone.
 */
import { createContext, useContext, type ComponentPropsWithRef } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextStyle,
} from 'react-native';

export const FONT = {
  regular: 'ReadexPro-Regular',
  medium: 'ReadexPro-Medium',
  semibold: 'ReadexPro-SemiBold',
  bold: 'ReadexPro-Bold',
} as const;

const READEX = new Set<string>(Object.values(FONT));

export function fontFamilyFor(weight?: TextStyle['fontWeight']): string {
  const w =
    weight === 'bold' ? 700 : weight == null || weight === 'normal' ? 400 : Number(weight) || 400;
  if (w >= 700) return FONT.bold;
  if (w >= 600) return FONT.semibold;
  if (w >= 500) return FONT.medium;
  return FONT.regular;
}

/** Nested <Text> without its own fontWeight inherits the parent's face. */
const InheritedFamily = createContext<string | null>(null);

function withBrandFont(style: StyleProp<TextStyle>, inherited: string | null) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  if (flat.fontFamily && !READEX.has(flat.fontFamily)) {
    return { style, family: null };
  }
  if (flat.fontWeight == null && !flat.fontFamily && inherited) {
    return { style, family: inherited };
  }
  const family = flat.fontFamily ?? fontFamilyFor(flat.fontWeight);
  // fontWeight is reset so Android doesn't synthesise bold on top of the bold file.
  return { style: [style, { fontFamily: family, fontWeight: 'normal' as const }], family };
}

export function Text({ style, children, ...rest }: ComponentPropsWithRef<typeof RNText>) {
  const inherited = useContext(InheritedFamily);
  const resolved = withBrandFont(style, inherited);
  return (
    <RNText {...rest} style={resolved.style}>
      <InheritedFamily.Provider value={resolved.family}>{children}</InheritedFamily.Provider>
    </RNText>
  );
}

export function TextInput({ style, ...rest }: ComponentPropsWithRef<typeof RNTextInput>) {
  return <RNTextInput {...rest} style={withBrandFont(style, null).style} />;
}
