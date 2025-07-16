import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock } from 'lucide-react-native';
import { getPublicScreenings, Screening } from '../services/screening';




export default function DateTimeSelectionScreen() {
  const { theaterId, movieId } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [dateOptions, setDateOptions] = useState<{ id: string, date: string, day: string, month: string, isToday: boolean, raw: Date }[]>([]);

  // useEffect fetch screenings và set dateOptions
  useEffect(() => {
    const fetchScreenings = async () => {
      const params = {
        theaterId: theaterId ? String(theaterId) : undefined,
        movieId: movieId ? String(movieId) : undefined
      };
      
      const data = await getPublicScreenings(params);
      setScreenings(data);

      // Tạo 5 ngày liên tiếp từ hôm nay
      const today = new Date();
      today.setUTCHours(0,0,0,0);
      const fiveDates = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(today);
        d.setUTCHours(0,0,0,0);
        d.setUTCDate(d.getUTCDate() + i);
        const dayOfWeek = ['CN','Th2','Th3','Th4','Th5','Th6','Th7'][d.getUTCDay()];
        return {
          id: d.toISOString().slice(0,10), // luôn là YYYY-MM-DD UTC
          date: d.getUTCDate().toString().padStart(2,'0'),
          day: dayOfWeek,
          month: `Th${d.getUTCMonth()+1}`,
          isToday: i === 0,
          raw: d,
        };
      });
      setDateOptions(fiveDates);
    };
    fetchScreenings();
  }, [theaterId, movieId]);

  // useEffect set selectedDate khi dateOptions hoặc screenings đổi
  useEffect(() => {
    if (dateOptions.length === 0) return;
    // Nếu selectedDate chưa có hoặc không còn hợp lệ
    if (!selectedDate || !dateOptions.some(d => d.id === selectedDate)) {
      // Tìm ngày có suất chiếu gần nhất
      const availableDate = dateOptions.find(d =>
        screenings.some(s => s.startTime.slice(0,10) === d.id)
      );
      setSelectedDate(availableDate ? availableDate.id : dateOptions[0].id);
    }
  }, [dateOptions, screenings]);

  const filteredTimeSlots = screenings
    .filter(s => s.startTime.slice(0,10) === selectedDate)
    .map((s, idx) => ({
      id: s._id,
      time: new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      available: true, // Có thể thêm logic kiểm tra hết vé nếu có
      isVIP: false, // Có thể thêm logic VIP nếu có
      screening: s,
    }));

  const handleTimeSelect = (timeSlot: any) => {
    if (timeSlot.available) {
      setSelectedTime(timeSlot.id);
      router.push({
        pathname: '/seat-selection',
        params: {
          screeningId: timeSlot.id,
          dateId: selectedDate,
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn ngày & giờ</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Chọn ngày</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dateOptions.map((date) => (
              <TouchableOpacity
                key={date.id}
                style={[
                  styles.dateCard,
                  selectedDate === date.id && styles.dateCardSelected,
                  date.isToday && styles.dateCardToday,
                ]}
                onPress={() => setSelectedDate(date.id)}
              >
                <Text style={[
                  styles.dateNumber,
                  date.isToday && styles.dateNumberToday,
                  selectedDate === date.id && styles.dateNumberSelected,
                ]}>
                  {date.date}
                </Text>
                <Text style={[
                  styles.dateDay,
                  date.isToday && styles.dateDayToday,
                  selectedDate === date.id && styles.dateDaySelected,
                ]}>
                  {date.day}
                </Text>
                <Text style={[
                  styles.dateMonth,
                  date.isToday && styles.dateMonthToday,
                  selectedDate === date.id && styles.dateMonthSelected,
                ]}>
                  {date.month}
                </Text>
                {date.isToday && (
                  <View style={styles.todayIndicator}>
                    <Text style={styles.todayText}>Hôm nay</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Chọn suất chiếu</Text>
          </View>
          <View style={styles.timeSlotContainer}>
            {filteredTimeSlots.length === 0 ? (
              <Text style={{ color: '#fff', marginTop: 10 }}>Không có suất chiếu cho ngày này.</Text>
            ) : (
              filteredTimeSlots.map((timeSlot) => (
                <TouchableOpacity
                  key={timeSlot.id}
                  style={[
                    styles.timeSlot,
                    !timeSlot.available && styles.timeSlotDisabled,
                    timeSlot.isVIP && styles.timeSlotVIP,
                    selectedTime === timeSlot.id && styles.timeSlotSelected,
                  ]}
                  onPress={() => handleTimeSelect(timeSlot)}
                  disabled={!timeSlot.available}
                >
                  <Text style={[
                    styles.timeSlotText,
                    !timeSlot.available && styles.timeSlotTextDisabled,
                    selectedTime === timeSlot.id && styles.timeSlotTextSelected,
                  ]}>
                    {timeSlot.time}
                  </Text>
                  {timeSlot.isVIP && (
                    <View style={styles.vipIndicator}>
                      <Text style={styles.vipIndicatorText}>VIP</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.legendText}>Suất VIP</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#1A1A1A' }]} />
            <Text style={styles.legendText}>Suất thường</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#333' }]} />
            <Text style={styles.legendText}>Đã hết vé</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFD700',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
  },
  dateScroll: {
    paddingVertical: 10,
  },
  dateCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    minWidth: 70,
    position: 'relative',
  },
  dateCardSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  dateCardToday: {
    borderColor: '#FFD700',
  },
  dateNumber: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateNumberSelected: {
    color: '#000000',
  },
  dateNumberToday: {
    color: '#FFD700',
  },
  dateDay: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  dateDaySelected: {
    color: '#000000',
  },
  dateDayToday: {
    color: '#FFD700',
  },
  dateMonth: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    color: '#666',
  },
  dateMonthSelected: {
    color: '#000000',
  },
  dateMonthToday: {
    color: '#FFD700',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8,
    color: '#000000',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotVIP: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  timeSlotSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  timeSlotDisabled: {
    opacity: 0.5,
  },
  timeSlotText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  timeSlotTextSelected: {
    color: '#000000',
  },
  timeSlotTextDisabled: {
    color: '#666',
  },
  vipIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFD700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vipIndicatorText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8,
    color: '#000000',
  },
  legend: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
});