import Svg, { Circle, Path } from 'react-native-svg';

/**
 * The Qirsh mark: a lowercase q whose bowl is a coin, with the two dots of ق
 * stepping up as gold coins. Same geometry as branding/logos/svg/qirsh-mark.svg.
 *
 * Use body "#0B5F57" + dots "#E29A1B" on light grounds,
 * body "#FAF6EC" + dots "#F0B341" on Nile / dark grounds.
 */
const BODY =
  'M280 252V422A34 34 0 0 1 212 422V372.07A140 140 0 1 1 280 252Z' +
  'M68 252A72 72 0 1 0 212 252A72 72 0 1 0 68 252Z';

const VIEW_W = 280;
const VIEW_H = 454; // from the top of the highest dot to the stem's rounded foot

type QirshMarkProps = {
  /** Rendered height in px; width follows the mark's proportions. */
  size?: number;
  body?: string;
  dots?: string;
};

export function QirshMark({ size = 48, body = '#0B5F57', dots = '#E29A1B' }: QirshMarkProps) {
  return (
    <Svg
      width={(size * VIEW_W) / VIEW_H}
      height={size}
      viewBox={`0 2 ${VIEW_W} ${VIEW_H}`}
      accessibilityRole="image"
      accessibilityLabel="Qirsh"
    >
      <Path d={BODY} fill={body} fillRule="evenodd" />
      <Circle cx={184} cy={72} r={28} fill={dots} />
      <Circle cx={246} cy={30} r={28} fill={dots} />
    </Svg>
  );
}
