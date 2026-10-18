import { Image, type ImageProps } from 'expo-image';

const FALLBACK = 'https://placehold.co/400x300';

export interface MediaProps extends Omit<ImageProps, 'source'> {
  /** Remote URI. Falls back to a neutral placeholder when omitted. */
  src?: string;
}

/** Cover image with a neutral placeholder used by demo media slots. */
export function Media({ src, style, ...props }: MediaProps) {
  return (
    <Image
      source={{ uri: src || FALLBACK }}
      contentFit="cover"
      transition={200}
      style={[{ backgroundColor: '#e7e5e4' }, style]}
      {...props}
    />
  );
}
