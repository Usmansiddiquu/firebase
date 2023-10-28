import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc }
    from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject }
    from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

const firebaseConfig = {

};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const storage = getStorage();
const userProfile = document.getElementById("user-profile");


const uploadFile = (file) => {
    return new Promise((resolve, reject) => {
        const mountainsRef = ref(storage, `images/${file.name}`);
        const uploadTask = uploadBytesResumable(mountainsRef, file);
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            },
            (error) => {
                reject(error)
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    })
}

const getUserData = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        let fullName = document.getElementById("fullName")
        let email = document.getElementById("email")
        console.log("Document data:", docSnap.data());
        fullName.value = docSnap.data().fullName;
        email.value = docSnap.data().email;
        userProfile.src = docSnap.data().picture
    } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
    }
}

onAuthStateChanged(auth, (user) => {
    const uid = localStorage.getItem("uid")
    if (user && uid) {
        console.log(user)
        getUserData(user.uid)
        if (location.pathname !== '/profile.html') {
            location.href = "profile.html"
        }
    } else {
        if (location.pathname !== '/index.html' && location.pathname !== "/register.html") {
            location.href = "index.html"
        }
    }
});


const logoutBtn = document.getElementById("logout-btn")

logoutBtn && logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        localStorage.clear()
        location.href = "index.html"
    }).catch((error) => {
        // An error happened.
    });

})


const registerBtn = document.getElementById('register-btn');

registerBtn && registerBtn.addEventListener("click", (e) => {
    e.preventDefault()
    let fullName = document.getElementById("fullName")
    let email = document.getElementById("email")
    let password = document.getElementById("password")
    createUserWithEmailAndPassword(auth, email.value, password.value)
        .then(async (userCredential) => {
            try {
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    fullName: fullName.value,
                    email: email.value,
                    password: password.value
                });
                Swal.fire({
                    icon: 'success',
                    title: 'User register successfully',
                })
                localStorage.setItem("uid", user.uid)
                location.href = "profile.html"
            } catch (err) {
                console.log(err)
            }
        })
        .catch((error) => {
            const errorMessage = error.message;
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMessage,
            })
        });
})


const loginBtn = document.getElementById('login-btn');

loginBtn && loginBtn.addEventListener("click", (e) => {
    e.preventDefault()
    let email = document.getElementById("email")
    let password = document.getElementById("password")
    signInWithEmailAndPassword(auth, email.value, password.value)
        .then(async (userCredential) => {
            try {
                Swal.fire({
                    icon: 'success',
                    title: 'User login successfully',
                })
                localStorage.setItem("uid", user.uid)
                location.href = "profile.html"
            } catch (err) {
                console.log(err)
            }
        })
        .catch((error) => {
            const errorMessage = error.message;
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMessage,
            })
        });
})

const fileInput = document.getElementById("file-input");

fileInput.addEventListener("change", () => {
    console.log(fileInput.files[0])
    userProfile.src = URL.createObjectURL(fileInput.files[0])
})

const updateProfile = document.getElementById("update-profile");

updateProfile && updateProfile.addEventListener("click", async () => {
    let uid = localStorage.getItem("uid")
    let fullName = document.getElementById("fullName")
    let email = document.getElementById("email")
    const imageUrl = await uploadFile(fileInput.files[0])
    const washingtonRef = doc(db, "users", uid);
    await updateDoc(washingtonRef, {
        fullName: fullName.value,
        email: email.value,
        picture: imageUrl
    });
    Swal.fire({
        icon: 'success',
        title: 'User updated successfully',
    })
})