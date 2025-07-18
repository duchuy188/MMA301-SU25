import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { ArrowLeft, Star, Clock, Calendar, Play, User, Users, Film, Building2, Flag } from 'lucide-react-native';
import { useState } from 'react';
import { Movie } from '../../services/movie';
import { router } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import React from 'react';
interface MovieViewProps {
  movie: Movie;
  onBack: () => void;
}

export default function MovieView({ movie, onBack }: MovieViewProps) {
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Thêm hàm formatDate
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const handleBookTicket = () => {
    router.push({
      pathname: '/cinema-selection',
      params: { movieId: movie._id }
    });
  };

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const formattedDuration = `${movie.duration} phút`;

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết phim</Text>
      </View>

      <View style={styles.moviePoster}>
        <View style={styles.goldFrame}>
          <Image source={{ uri: movie.posterUrl }} style={styles.posterImage} />
        </View>
      </View>

      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{movie.vietnameseTitle || movie.title}</Text>
        
        <View style={styles.movieMetaContainer}>
          <View style={styles.ratingContainer}>
            <View style={styles.ratingItem}>
              <Star size={16} color="#FFD700" />
              <Text style={styles.rating}>{movie.rating ? movie.rating.toFixed(1) : '7.5'}</Text>
            </View>
            <Text style={styles.voteCount}>({movie.votes || 0} đánh giá)</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Clock size={16} color="#666" />
              <Text style={styles.infoText}>{formattedDuration}</Text>
            </View>
            <View style={styles.infoItem}>
              <Calendar size={16} color="#666" />
              <Text style={styles.infoText}>{movie.genre}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.movieDetails}>
          <View style={styles.detailRow}>
            <User size={16} color="#FFD700" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Đạo diễn:</Text>
            <Text style={styles.detailValue}>{movie.directors?.join(', ')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Users size={16} color="#FFD700" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Diễn viên:</Text>
            <Text style={styles.detailValue}>{movie.actors?.join(', ')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#FFD700" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Ngày chiếu:</Text>
            <Text style={styles.detailValue}>{formatDate(movie.releaseDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Building2 size={16} color="#FFD700" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Nhà SX:</Text>
            <Text style={styles.detailValue}>{movie.producer}</Text>
          </View>
          <View style={styles.detailRow}>
            <Flag size={16} color="#FFD700" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Quốc gia:</Text>
            <Text style={styles.detailValue}>{movie.country}</Text>
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionTitle}>Nội dung phim</Text>
          <Text style={styles.descriptionText}>{movie.description}</Text>
        </View>

        {movie.trailerUrl && (
          <View style={styles.trailerSection}>
            <TouchableOpacity 
              style={styles.trailerButton}
              onPress={() => setTrailerModalVisible(true)}
            >
              <Play size={20} color="#000000" />
              <Text style={styles.trailerButtonText}>Xem trailer</Text>
            </TouchableOpacity>
            
            <Modal
              animationType="slide"
              transparent={true}
              visible={trailerModalVisible}
              onRequestClose={() => {
                setTrailerModalVisible(false);
                setPlaying(false);
              }}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Trailer</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setTrailerModalVisible(false);
                        setPlaying(false);
                      }}
                    >
                      <Text style={{color: '#FFD700', fontSize: 16}}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {movie.trailerUrl && (
                    <YoutubePlayer
                      height={220}
                      play={playing}
                      videoId={getYoutubeVideoId(movie.trailerUrl) || ''}
                      onChangeState={(event: string) => {
                        if (event === 'ended') {
                          setPlaying(false);
                        }
                      }}
                    />
                  )}
                </View>
              </View>
            </Modal>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookTicket}>
          <Text style={styles.bookButtonText}>ĐẶT VÉ</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  moviePoster: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  goldFrame: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFD700',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  posterImage: {
    width: 250,
    height: 350,
    resizeMode: 'cover',
  },
  movieInfo: {
    paddingHorizontal: 20,
  },
  movieTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  movieMetaContainer: {
    marginBottom: 30,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  voteCount: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#999',
  },
  movieDetails: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
    width: 80,
  },
  detailValue: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
  },
  description: {
    marginBottom: 30,
  },
  descriptionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  trailerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trailerButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 0,
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  bookButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  bookButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#000000',
    letterSpacing: 1,
  },
}); 