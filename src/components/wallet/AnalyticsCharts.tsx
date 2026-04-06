import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import type { WalletPalette } from '@/src/utils/wallet-theme';

type Cat = { name: string; value: number; color: string };
type Month = { month: string; amount: number };

const CHART_W = 300;
const CHART_H = 140;
const PAD = 24;

export function CategorySpendingBars({
  data,
  total,
  palette,
}: {
  data: Cat[];
  total: number;
  palette: WalletPalette;
}) {
  return (
    <View style={styles.gap}>
      {data.map((cat) => {
        const pct = total > 0 ? (cat.value / total) * 100 : 0;
        return (
          <View key={cat.name} style={styles.catRow}>
            <View style={styles.catLabelRow}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text style={[styles.catName, { color: palette.mutedForeground }]} numberOfLines={1}>
                {cat.name}
              </Text>
              <Text style={[styles.catPct, { color: palette.foreground }]}>{pct.toFixed(0)}%</Text>
            </View>
            <View style={[styles.barTrack, { backgroundColor: palette.muted }]}>
              <View style={[styles.barFill, { flex: cat.value || 0.001, backgroundColor: cat.color }]} />
              <View style={{ flex: Math.max(total - cat.value, 0.001) }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function MonthlySpendingLine({
  data,
  palette,
}: {
  data: Month[];
  palette: WalletPalette;
}) {
  const { points } = useMemo(() => {
    const amounts = data.map((d) => d.amount);
    const m = Math.max(...amounts, 1);
    const innerW = CHART_W - PAD * 2;
    const innerH = CHART_H - PAD * 2;
    const pts = data.map((d, i) => {
      const x = PAD + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = PAD + innerH - (d.amount / m) * innerH;
      return { x, y };
    });
    return { points: pts };
  }, [data]);

  const poly = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.lineWrap}>
      <Svg width="100%" height={CHART_H + 8} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <Line
          x1={PAD}
          y1={CHART_H - PAD}
          x2={CHART_W - PAD}
          y2={CHART_H - PAD}
          stroke={palette.border}
          strokeWidth={1}
        />
        <Line x1={PAD} y1={PAD} x2={PAD} y2={CHART_H - PAD} stroke={palette.border} strokeWidth={1} />
        <Polyline points={poly} fill="none" stroke={palette.primary} strokeWidth={3} />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={5} fill={palette.primary} />
        ))}
      </Svg>
      <View style={styles.monthLabels}>
        {data.map((d) => (
          <Text key={d.month} style={[styles.monthText, { color: palette.mutedForeground }]}>
            {d.month}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  catRow: { gap: 6 },
  catLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 12 },
  catPct: { fontSize: 12, fontWeight: '700' },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barFill: {
    borderRadius: 4,
  },
  lineWrap: { alignItems: 'center' },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  monthText: { fontSize: 10 },
});
