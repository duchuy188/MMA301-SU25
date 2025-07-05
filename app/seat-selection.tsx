import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Crown, Monitor } from 'lucide-react-native';
import { useState } from 'react';

const seatMap = [
  ['A1', 'A2', 'A3', 'A4', 'A5', '', 'A6', 'A7', 'A8', 'A9', 'A10'],
  ['B1', 'B2', 'B3', 'B4', 'B5', '', 'B6', 'B7', 'B8', 'B9', 'B10'],
  ['C1', 'C2', 'C3', 'C4', 'C5', '', 'C6', 'C7', 'C8', 'C9', 'C10'],
  ['D1', 'D2', 'D3', 'D4', 'D5', '', 'D6', 'D7', 'D8', 'D9', 'D10'],
  ['E1', 'E2', 'E3', 'E4', 'E5', '', 'E6', 'E7', 'E8', 'E9', 'E10'],
  ['F1', 'F2', 'F3', 'F4', 'F5', '', 'F6', 'F7', 'F8', 'F9', 'F10'],
  ['G1', 'G2', 'G3', 'G4', 'G5', '', 'G6', 'G7', 'G8', 'G9', 'G10'],
  ['H1', 'H2', 'H3', 'H4', 'H5', '', 'H6', 'H7', 'H8', 'H9', 'H10'],
];

const occupiedSeats = ['A1', 'A2', 'B5', 'C3', 'D7', 'E8', 'F4', 'G9', 'H2'];
const vipSeats = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'];

export default function SeatSelectionScreen() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const handleSeatSelect = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;
    
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const getSeatStyle = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) {
      return [styles.seat, styles.seatOccupied];
    }
    if (selectedSeats.includes(seatId)) {
      return [styles.seat, styles.seatSelected];
    }
    if (vipSeats.includes(seatId)) {
      return [styles.seat, styles.seatVIP];
    }
    return [styles.seat, styles.seatAvailable];
  };

  const handleContinue = () => {
    if (selectedSeats.length > 0) {
      router.push({
        pathname: '/payment',
        params: { seats: selectedSeats.join(',') },
      });
    }
  };

  const calculateTotal = () => {
    const regularPrice = 120000;
    const vipPrice = 200000;
    
    return selectedSeats.reduce((total, seat) => {
      return total + (vipSeats.includes(seat) ? vipPrice : regularPrice);
    }, 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn ghế</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.screenContainer}>
          <View style={styles.screen}>
            <Monitor size={24} color="#FFD700" />
            <Text style={styles.screenText}>MÀN ẢNH</Text>
          </View>
          <View style={styles.curtain} />
        </View>

        <View style={styles.seatMapContainer}>
          {seatMap.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.seatRow}>
              {row.map((seat, seatIndex) => (
                <View key={seatIndex} style={styles.seatSlot}>
                  {seat ? (
                    <TouchableOpacity
                      style={getSeatStyle(seat)}
                      onPress={() => handleSeatSelect(seat)}
                    >
                      <Text style={[
                        styles.seatText,
                        occupiedSeats.includes(seat) && styles.seatTextOccupied,
                        selectedSeats.includes(seat) && styles.seatTextSelected,
                      ]}>
                        {seat}
                      </Text>
                      {vipSeats.includes(seat) && !occupiedSeats.includes(seat) && (
                        <Crown size={8} color="#FFD700" style={styles.vipIcon} />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.seatGap} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.vipSection}>
          <View style={styles.vipBorder} />
          <Text style={styles.vipSectionLabel}>KHU VỰC VIP</Text>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatAvailable]} />
            <Text style={styles.legendText}>Ghế trống</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatVIP]} />
            <Text style={styles.legendText}>Ghế VIP</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatSelected]} />
            <Text style={styles.legendText}>Đã chọn</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatOccupied]} />
            <Text style={styles.legendText}>Đã bán</Text>
          </View>
        </View>

        {selectedSeats.length > 0 && (
          <View style={styles.selectionSummary}>
            <Text style={styles.summaryTitle}>Ghế đã chọn:</Text>
            <Text style={styles.summarySeats}>{selectedSeats.join(', ')}</Text>
            <Text style={styles.summaryTotal}>
              Tổng tiền: {calculateTotal().toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedSeats.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              Tiếp tục ({selectedSeats.length} ghế)
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  screenContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  screen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  screenText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
  },
  curtain: {
    width: '80%',
    height: 2,
    backgroundColor: '#FFD700',
    marginTop: 10,
    borderRadius: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  seatMapContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seatSlot: {
    width: 28,
    height: 28,
    marginHorizontal: 2,
  },
  seat: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  seatAvailable: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  seatVIP: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  seatSelected: {
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  seatOccupied: {
    backgroundColor: '#666',
    borderWidth: 1,
    borderColor: '#666',
  },
  seatGap: {
    width: 28,
    height: 28,
  },
  seatText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8,
    color: '#FFFFFF',
  },
  seatTextSelected: {
    color: '#000000',
  },
  seatTextOccupied: {
    color: '#999',
  },
  vipIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  vipSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  vipBorder: {
    width: '60%',
    height: 1,
    backgroundColor: '#FFD700',
    marginBottom: 5,
  },
  vipSectionLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFD700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  legendItem: {
    alignItems: 'center',
    gap: 4,
  },
  legendSeat: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    color: '#999',
  },
  selectionSummary: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginBottom: 20,
  },
  summaryTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  summarySeats: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryTotal: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#000000',
  },
});