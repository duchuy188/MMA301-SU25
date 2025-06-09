import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User } from 'lucide-react-native';

const generateSeats = () => {
  const seats = [];
  const rows = 10;
  const seatsPerRow = 4;
  const occupiedSeats = ['A2', 'A4', 'B1', 'C3', 'D2', 'F1', 'G4', 'H2'];

  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
    const rowSeats = [];
    
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatId = `${rowLetter}${seat}`;
      rowSeats.push({
        id: seatId,
        isOccupied: occupiedSeats.includes(seatId),
        isSelected: false,
      });
    }
    seats.push(rowSeats);
  }
  
  return seats;
};

export default function SeatSelectionScreen() {
  const params = useLocalSearchParams();
  const [seats, setSeats] = useState(generateSeats());
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const routeInfo = {
    company: params.company as string,
    from: params.from as string,
    to: params.to as string,
    departureTime: params.departureTime as string,
    price: params.price as string,
  };

  const handleSeatPress = (rowIndex: number, seatIndex: number) => {
    const seat = seats[rowIndex][seatIndex];
    
    if (seat.isOccupied) {
      Alert.alert('Ghế đã được đặt', 'Vui lòng chọn ghế khác');
      return;
    }

    const newSeats = [...seats];
    const isCurrentlySelected = seat.isSelected;
    
    // Toggle seat selection
    newSeats[rowIndex][seatIndex].isSelected = !isCurrentlySelected;
    
    // Update selected seats array
    if (isCurrentlySelected) {
      setSelectedSeats(prev => prev.filter(id => id !== seat.id));
    } else {
      setSelectedSeats(prev => [...prev, seat.id]);
    }
    
    setSeats(newSeats);
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một ghế');
      return;
    }

    const totalPrice = selectedSeats.length * parseInt(routeInfo.price.replace(/[^\d]/g, ''));
    
    router.push({
      pathname: '/payment',
      params: {
        ...params,
        selectedSeats: selectedSeats.join(','),
        totalAmount: totalPrice.toString(),
      }
    });
  };

  const getSeatStyle = (seat: any) => {
    if (seat.isOccupied) {
      return [styles.seat, styles.seatOccupied];
    } else if (seat.isSelected) {
      return [styles.seat, styles.seatSelected];
    } else {
      return [styles.seat, styles.seatAvailable];
    }
  };

  const getSeatTextStyle = (seat: any) => {
    if (seat.isOccupied) {
      return styles.seatTextOccupied;
    } else if (seat.isSelected) {
      return styles.seatTextSelected;
    } else {
      return styles.seatTextAvailable;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn chỗ ngồi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Info */}
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>
            {routeInfo.from} → {routeInfo.to}
          </Text>
          <Text style={styles.companyText}>{routeInfo.company}</Text>
          <Text style={styles.timeText}>Khởi hành: {routeInfo.departureTime}</Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatAvailable]} />
            <Text style={styles.legendText}>Trống</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatSelected]} />
            <Text style={styles.legendText}>Đã chọn</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatOccupied]} />
            <Text style={styles.legendText}>Đã đặt</Text>
          </View>
        </View>

        {/* Bus Layout */}
        <View style={styles.busContainer}>
          {/* Driver section */}
          <View style={styles.driverSection}>
            <Text style={styles.driverText}>Tài xế</Text>
          </View>

          {/* Seats */}
          <View style={styles.seatsContainer}>
            {seats.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.seatRow}>
                {/* Left side seats */}
                <View style={styles.seatGroup}>
                  {row.slice(0, 2).map((seat, seatIndex) => (
                    <TouchableOpacity
                      key={seat.id}
                      style={getSeatStyle(seat)}
                      onPress={() => handleSeatPress(rowIndex, seatIndex)}
                      disabled={seat.isOccupied}
                    >
                      <Text style={getSeatTextStyle(seat)}>
                        {seat.id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Aisle */}
                <View style={styles.aisle} />

                {/* Right side seats */}
                <View style={styles.seatGroup}>
                  {row.slice(2, 4).map((seat, seatIndex) => (
                    <TouchableOpacity
                      key={seat.id}
                      style={getSeatStyle(seat)}
                      onPress={() => handleSeatPress(rowIndex, seatIndex + 2)}
                      disabled={seat.isOccupied}
                    >
                      <Text style={getSeatTextStyle(seat)}>
                        {seat.id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Selected Seats Info */}
        {selectedSeats.length > 0 && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedTitle}>Ghế đã chọn:</Text>
            <View style={styles.selectedSeats}>
              {selectedSeats.map((seatId) => (
                <View key={seatId} style={styles.selectedSeatTag}>
                  <Text style={styles.selectedSeatText}>{seatId}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>
            {selectedSeats.length} ghế × {routeInfo.price}
          </Text>
          <Text style={styles.totalPrice}>
            {(selectedSeats.length * parseInt(routeInfo.price.replace(/[^\d]/g, ''))).toLocaleString()}đ
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedSeats.length === 0 && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={selectedSeats.length === 0}
        >
          <Text style={styles.continueButtonText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  routeInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  companyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#F97316',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSeat: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  busContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  driverText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  seatsContainer: {
    gap: 12,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  aisle: {
    width: 24,
  },
  seat: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  seatAvailable: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  seatSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  seatOccupied: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  seatTextAvailable: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  seatTextSelected: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  seatTextOccupied: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  selectedInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  selectedSeats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedSeatTag: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  selectedSeatText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  bottomAction: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F97316',
  },
  continueButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});