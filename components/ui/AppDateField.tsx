import { useAppTheme } from '@/context/AppThemeContext';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppBottomModal from './AppBottomModal';
import AppButton from './AppButton';
import AppText from './AppText';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function todayIsoDate() {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function toIsoDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIsoDate(value?: string | null) {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }

  return date;
}

function getCalendarDays(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstDay }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export default function AppDateField({ label, value, onChange }: Props) {
  const { theme } = useAppTheme();
  const selectedDate = parseIsoDate(value) ?? parseIsoDate(todayIsoDate())!;
  const [visible, setVisible] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate.getMonth());
  const [visibleYear, setVisibleYear] = useState(() => selectedDate.getFullYear());
  const days = useMemo(() => getCalendarDays(visibleYear, visibleMonth), [visibleYear, visibleMonth]);

  const open = () => {
    const current = parseIsoDate(value) ?? parseIsoDate(todayIsoDate())!;
    setVisibleMonth(current.getMonth());
    setVisibleYear(current.getFullYear());
    setVisible(true);
  };

  const moveMonth = (direction: -1 | 1) => {
    const next = new Date(visibleYear, visibleMonth + direction, 1);
    setVisibleMonth(next.getMonth());
    setVisibleYear(next.getFullYear());
  };

  const selectDay = (day: number) => {
    onChange(toIsoDate(visibleYear, visibleMonth, day));
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
        {label}
      </AppText>

      <Pressable
        onPress={open}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: theme.colors.inputBorder,
            borderRadius: theme.radius.md,
            minHeight: theme.density === 'COMPACT' ? 46 : 54,
            opacity: pressed ? 0.75 : 1,
            padding: theme.spacing.md,
          },
        ]}
      >
        <AppText>{value || 'Seleccionar fecha'}</AppText>
      </Pressable>

      <AppBottomModal
        visible={visible}
        title="Seleccionar fecha"
        onClose={() => setVisible(false)}
        maxHeight="88%"
        showCancelButton={false}
        scroll={false}
      >
        <View style={styles.calendarShell}>
          <View style={styles.monthHeader}>
            <View style={styles.monthButton}>
              <AppButton title="<" variant="secondary" onPress={() => moveMonth(-1)} />
            </View>
            <View style={styles.monthTitle}>
              <AppText variant="subtitle" bold>
                {monthNames[visibleMonth]} {visibleYear}
              </AppText>
            </View>
            <View style={styles.monthButton}>
              <AppButton title=">" variant="secondary" onPress={() => moveMonth(1)} />
            </View>
          </View>

          <CalendarGrid
            days={days}
            selectedDate={selectedDate}
            visibleMonth={visibleMonth}
            visibleYear={visibleYear}
            onSelectDay={selectDay}
          />

          <View style={styles.actions}>
            <AppButton title="Cancelar" variant="cancel" onPress={() => setVisible(false)} />
            <AppButton
              title="Hoy"
              variant="operation"
              onPress={() => {
                onChange(todayIsoDate());
                setVisible(false);
              }}
            />
          </View>
        </View>
      </AppBottomModal>
    </View>
  );
}

function CalendarGrid({
  days,
  selectedDate,
  visibleMonth,
  visibleYear,
  onSelectDay,
}: {
  days: (number | null)[];
  selectedDate: Date;
  visibleMonth: number;
  visibleYear: number;
  onSelectDay?: (day: number) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <>
      <View style={styles.weekRow}>
        {weekDays.map((day, index) => (
          <AppText key={`${day}-${index}`} bold color={theme.colors.calendarText} style={styles.weekCell}>
            {day}
          </AppText>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          const selected =
            day !== null &&
            selectedDate.getFullYear() === visibleYear &&
            selectedDate.getMonth() === visibleMonth &&
            selectedDate.getDate() === day;

          return (
            <Pressable
              key={`${visibleYear}-${visibleMonth}-${index}`}
              disabled={day === null || !onSelectDay}
              onPress={() => day !== null && onSelectDay?.(day)}
              style={[
                styles.dayCell,
                {
                  backgroundColor: selected ? theme.colors.calendarSelectedBackground : 'transparent',
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText color={selected ? theme.colors.calendarSelectedText : theme.colors.calendarText}>
                {day ?? ''}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export function AppDatePreview({
  selectedBackground,
  selectedText,
  textColor,
}: {
  selectedBackground?: string;
  selectedText?: string;
  textColor?: string;
}) {
  const { theme } = useAppTheme();
  const selectedDate = new Date(2026, 4, 5);
  const days = [null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <View style={styles.previewShell}>
      <View style={styles.monthTitle}>
        <AppText variant="subtitle" bold>
          Mayo 2026
        </AppText>
      </View>
      <CalendarPreviewGrid
        days={days}
        selectedDate={selectedDate}
        selectedBackground={selectedBackground || theme.colors.calendarSelectedBackground}
        selectedText={selectedText || theme.colors.calendarSelectedText}
        textColor={textColor || theme.colors.calendarText}
      />
    </View>
  );
}

function CalendarPreviewGrid({
  days,
  selectedDate,
  selectedBackground,
  selectedText,
  textColor,
}: {
  days: (number | null)[];
  selectedDate: Date;
  selectedBackground: string;
  selectedText: string;
  textColor: string;
}) {
  const { theme } = useAppTheme();

  return (
    <>
      <View style={styles.weekRow}>
        {weekDays.map((day, index) => (
          <AppText key={`${day}-${index}`} bold color={textColor} style={styles.weekCell}>
            {day}
          </AppText>
        ))}
      </View>
      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          const selected = day === selectedDate.getDate();

          return (
            <View
              key={`${day}-${index}`}
              style={[
                styles.dayCell,
                {
                  backgroundColor: selected ? selectedBackground : 'transparent',
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText color={selected ? selectedText : textColor}>{day ?? ''}</AppText>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  calendarShell: {
    alignSelf: 'center',
    maxWidth: 430,
    width: '100%',
  },
  container: {
    marginBottom: 12,
  },
  field: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    marginTop: 10,
  },
  monthButton: {
    width: 72,
  },
  monthTitle: {
    alignItems: 'center',
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekCell: {
    flex: 1,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '14.2857%',
  },
  previewShell: {
    alignSelf: 'center',
    marginTop: 8,
    maxWidth: 360,
    width: '100%',
  },
});
