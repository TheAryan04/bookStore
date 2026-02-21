import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import styles from "../../assets/styles/create.styles";
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../../store/authStore";
import { API_BASE_URL } from '../../constants/api';

const Create = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const {token} = useAuthStore();

  const router = useRouter();

  const pickImage = async () => {
    try {
      // request permission if needed
      if (Platform.OS !== "web") {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== "granted") {
          Alert.alert("Permission Denied", "We need camera roll permissions to upload an image");
          return;
        }
      }
      // launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "livePhotos", "videos"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // lower quality for smaller base64
        videoQuality: true,
        base64: true,
      });

      if(!result.canceled){
        setImage(result.assets[0].uri);

        // if base64 is provided, use it

        if (!result.canceled) {
          const asset = result.assets[0];

          setImage(asset.uri);
          setImageBase64(asset.base64);   // ← THIS is the correct modern way
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was a problem selecting your image");
    }
  }

  const handleSubmit = async () => {
    if (!title || !author || !price || !publishedDate || !caption || !imageBase64 || !rating) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    if (!token) {
      Alert.alert("Error", "Not authenticated. Please log in again.");
      router.push("/auth");
      return;
    }
    try {
      setLoading(true);
      console.log("Token being sent:", token?.substring(0, 10) + "...");

      const formData = new FormData();

      formData.append("title", title);
      formData.append("author", author);
      formData.append("price", price.toString());
      formData.append("publishedDate", publishedDate);
      formData.append("caption", caption);
      formData.append("rating", rating.toString());

      const filename = image.split("/").pop() || "photo.jpg";
      const ext = filename.split(".").pop();
      const mime = ext ? `image/${ext}` : "image/jpeg";

      formData.append("image", { 
        uri: image,
        name: filename,
        type: mime,
      });

      const response = await fetch(`${API_BASE_URL}/books`,{
        method:"POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Success", "Your book recommendation has been posted!");
      setTitle("");
      setAuthor("");
      setPrice("");
      setPublishedDate("");
      setCaption("");
      setRating(3);
      setImage(null);
      setImageBase64(null);
      router.push("/");

    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i<= 5; i++){
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starButton}>
          <Ionicons name={i <= rating ? "star" : "star-outline"} size={32} color={i <= rating ? "#f4b400" : COLORS.textSecondary} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}>
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Book Recommendation</Text>
            <Text style={styles.subtitle}>Share your favorite reads with others</Text>
          </View>
          <View style={styles.form}>
            {/* BOOK TITLE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="book-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter book title" placeholderTextColor={COLORS.placeholderText} value={title} onChangeText={setTitle} />
              </View>
            </View>
            {/* AUTHOR */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Author</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter author name" placeholderTextColor={COLORS.placeholderText} value={author} onChangeText={setAuthor} />
              </View>
            </View>
            {/* PRICE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price ($)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter price" placeholderTextColor={COLORS.placeholderText} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
              </View>
            </View>
            {/* PUBLISHED DATE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Published Date (YYYY-MM-DD)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g., 2023-01-15" placeholderTextColor={COLORS.placeholderText} value={publishedDate} onChangeText={setPublishedDate} />
              </View>
            </View>
            {/* RATING */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Rating</Text>
              {renderRatingPicker( )}
            </View>
            {/* IMAGE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.placeholderText}>Tap to select image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {/* CAPTION */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption</Text>
              <TextInput 
                style={styles.textArea} 
                placeholder="Write your review or thoughts about this book..." 
                placeholderTextColor={COLORS.placeholderText} 
                value={caption} 
                onChangeText={setCaption} 
                multiline 
              />
            </View>
            {/* SUBMIT BUTTON */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Create