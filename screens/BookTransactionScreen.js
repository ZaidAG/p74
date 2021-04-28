import React from 'react'
import{Text,View,TouchableOpacity,StyleSheet, TextInput,Image,KeyboardAvoidingView,ToastAndroid, Alert} from 'react-native'
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import * as firebase from 'firebase'
import db from '../config'
export default class BookTransactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedBookId:'',
            scannedStudentId:'',
            buttonState:'normal',
            transactionMessage:""
        }
    }
    getCameraPermission=async()=>{
        const{status}=await Permissions.askAsync(Permissions.CAMERA)
        this.state=({
            hasCameraPermissions:status==="granted",
            buttonState:id,
            scanned:false
        })
    }
    handleBarCodeScanned=async({type,data})=>{
        const {buttonState} = this.state 
        if(buttonState==="BookId"){ 
            this.setState({ scanned: true, scannedBookId: data, buttonState: 'normal' }); } 
            else if(buttonState==="StudentId"){ 
                this.setState({ scanned: true, scannedStudentId: data, buttonState: 'normal' }); }
    }
    initiateBookIssue=async()=>{
        db.collection("transaction").add({
            'studentId' : this.state.scannedStudentId,
             'bookId' : this.state.scannedBookId,
              'data' : firebase.firestore.Timestamp.now().toDate(),
               'transactionType' : "Issue"

        })
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability' : false
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
        })
        this.setState({scannedStudentId:'',
        scannedBookId:''
    })
    }
    initiateBookReturn=async()=>{
        db.collection("transaction").add({
            'studentId' : this.state.scannedStudentId,
             'bookId' : this.state.scannedBookId,
              'data' : firebase.firestore.Timestamp.now().toDate(),
               'transactionType' : "Return"

        })
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability' : true
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({scannedStudentId:'',
        scannedBookId:''
    })
    }
    checkBookEligibility=async()=>{
        const bookRef=await db
        .collection("books")
        .where("bookId","==",this.state.scannedBookId).get()
        var transactionType="";
        if(bookRef.docs.length==0){
            transactionType=false;
        }else{
            bookRef.docs.map(doc=>{
                var book=doc.data()
                if(book.bookAvailability){
                    transactionType="Issue"
                }else{
                    transactionType="Return"
                }
            })
        }
        return transactionType
    }
    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef=await db
        .collection("students")
        .where("studentId","==",this.state.scannedStudentId).get()
        var isStudentEligible="";
        if(studentRef.docs.length==0){
            this.setState({
                scannedStudentId:"",
                scannedBookId:""
            })
            isStudentEligible=false;
            Alert.alert("studentId does not exist in the system")
        }else{
            studentRef.docs.map(doc=>{
                var student=doc.data()
                if(student.numberOfBooksIssued<2){
                    isStudentEligible=true
                }else{
                    isStudentEligible=false
                    Alert.alert("student has already issued 2 or more books")
                    this.setState({
                        scannedStudentId:"",
                        scannedBookId:""
                    })
                }
            })
        }
        return isStudentEligible
    }
    checkStudentEligibilityForReturn=async()=>{
        const transactionRef=await db
        .collection("transations")
        .where("bookId","==",this.state.scannedBookId).limit(1).get()
        var isStudentEligible="";
        transactionRef.docs.map(doc=>{
            var lastBookTransaction=doc.data()
            if(lastBookTransaction.studentId===this.state.scannedStudentId){
                isStudentEligible=true
            }else{
                isStudentEligible=false
                Alert.alert("THE BOOK WAS NOT ISSUED BY THIS STUDENT")
                this.setState({
                    scannedStudentId:"",
                    scannedBookId:""
                })
        
                }
            })
        return isStudentEligible
    }
    handleTransaction=async()=>{
        var transactionType=await this.checkBookEligibility()
        if(!transactionType){
            Alert.alert("THE BOOK DOES NOT EXIST IN THE SYSTEM!!!!!!!")
            this.setState({
                scannedStudentId:"",
                scannedBookId:""
            })
        }else if(transactionType==="issue"){
          var isStudentEligible=await this.checkStudentEligibilityForBookIssue()
          if(isStudentEligible){
              this.initiateBookIssue()
              Alert.alert("BOOK ISSUED TO THE STUDENT!!!!!!!!!!!!!")
          }
        }else{
            var isStudentEligible=await this.checkStudentEligibilityForReturn()
            if(isStudentEligible){
                this.initiateBookReturn()
                Alert.alert("BOOK RETURNED TO THE LIBRARY!!!!!!!!!!!!!!!!!!!!!!")
            }  
        }
    }
    render(){
        const hasCameraPermissions=this.state.hasCameraPermissions
        const scanned=this.state.scanned
        const buttonState=this.state.buttonState
        if(buttonState!=="normal"&&hasCameraPermissions){
            return(
                <BarCodeScanner
                onBarCodeScanned={scanned ? undefined:this.handleBarCodeScanned}
                style={
                    StyleSheet.absoluteFillObject
                }
                />
            )
        }
        else if(buttonState==="normal"){
        return(
            <KeyboardAvoidingView style={styles.container}behavior="padding"enabled>
                <View>
                    <Image
                    source={require('../assets/booklogo.jpg')}
                    style={{width:200,height:200}}/>
                    <Text styles={{textAllign:'center',fontSize:30}}>Wily</Text>
                </View>
                <View style={styles.inputView}>
                    <TextInput
                    style={styles.inputBox}
                    placeholder = "Book ID"
                    onChangeText={
                        text=>this.setState({scannedBookId:text})
                    }
                value={this.state.scannedBookId}/>
                <TouchableOpacity
                
                style={styles.scanButton}
                    onPress={()=>{
                        this.getCameraPermission("BookId")
                    }}>
                   <Text style={styles.buttonText}>
                    Scan QR Code
                </Text> 
                </TouchableOpacity>

            </View>
            <View style={styles.inputView}>
                    <TextInput
                    style={styles.inputBox}
                    placeholder = "Student ID"
                    onChangeText={
                        text=>this.setState({scannedStudentId:text})
                    }
                value={this.state.scannedStudentId}/>
                <TouchableOpacity
                
                style={styles.scanButton}
                     onPress={()=>{
                        this.getCameraPermission("StudentId")
                    }}>
                   <Text style={styles.buttonText}>
                    Scan QR Code
                </Text> 
                </TouchableOpacity>
                </View>
                <TouchableOpacity
                style={styles.submitButton}
                onPress={async()=>{
                    var transactionMessage=this.handleTransaction()
                    this.setState({
                       scannedBookId:'',
                       scannedStudentId:''
                    })
                    }}>
                    <Text style = {styles.submitButtonText}>
                        Submit
                        </Text>
                </TouchableOpacity>
                </KeyboardAvoidingView>
                    
        )
    }
}
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    displayText:{
        fontSize:15,
        textDecorationLine:'underline',
    },
    scanButton:{
        backgroundColor:'red',
        padding:10,
        margin:10,
    },
    buttonText:{
        fontSize:15,
        textAlign:'center',
        marginTop:10
    },
    inputView:{
        flexDirection:'row',
        margin:20
    },
    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize:20,
    },
    scanButton:{
        backgroundColor:'green',
        width:50,
        borderWidth:1.5,
        borderLeftWidth:0
    },
    submitButton:{
        backgroundColor:'#FBC02D',
        width:100,
        height:50
    },
    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'white'
    },
    transactionMessage:{
        margin:10,
        color:"red",
    }
  });