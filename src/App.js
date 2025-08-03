import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
    deleteUser
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    addDoc, 
    collection, 
    query, 
    where, 
    onSnapshot,
    updateDoc,
    deleteDoc,
    Timestamp,
    getDocs
} from 'firebase/firestore';
import { ArrowRight, User, Building, Shield, LogOut, Heart, Menu, X, DollarSign, UserCog, MessageSquare, CheckCircle, Clock, Edit, BarChart2, KeyRound, Trash2 } from 'lucide-react';

// --- IMPORTANT: Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBaD5A7TsVFhwhumQFILePvYTtEdK1OyB4",
  authDomain: "shades-of-hue-2025.firebaseapp.com",
  projectId: "shades-of-hue-2025",
  storageBucket: "shades-of-hue-2025.firebasestorage.app",
  messagingSenderId: "930492769125",
  appId: "1:930492769125:web:e99c0d53efbb2d986e378c",
  measurementId: "G-BH7BTJ36FX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const helpCategories = ["Mental Health Support", "Legal Advice", "Community Connection", "Housing Assistance", "Healthcare Services", "Employment", "General Inquiry"];

// --- Main App Component ---
export default function App() {
    const [page, setPage] = useState('home');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNavOpen, setIsNavOpen] = useState(false);

    // --- Authentication State Observer & Page Setup ---
    useEffect(() => {
        document.title = "Shades of Hue";
        const favicon = document.querySelector("link[rel~='icon']");
        if (favicon) {
            favicon.href = 'https://img.freepik.com/free-vector/lgbt-pride-month-rainbow-heart-background_1017-38228.jpg';
        } else {
            const newFavicon = document.createElement('link');
            newFavicon.rel = 'icon';
            newFavicon.href = 'https://img.freepik.com/free-vector/lgbt-pride-month-rainbow-heart-background_1017-38228.jpg';
            document.head.appendChild(newFavicon);
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const fetchedUserData = { id: currentUser.uid, ...userDocSnap.data() };
                    if (fetchedUserData.status === 'deactivated') {
                        await signOut(auth);
                    } else {
                        setUser(currentUser);
                        setUserData(fetchedUserData);
                    }
                } else {
                     await signOut(auth);
                }
            } else {
                setUser(null);
                setUserData(null);
                setPage('home');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
    };
    
    const renderPage = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-800">Loading...</div>;
        }

        if (user && userData) {
             switch (userData.role) {
                case 'admin': return <AdminDashboard user={user} userData={userData} />;
                case 'organization': return <OrganizationDashboard user={user} userData={userData} />;
                case 'user': return <UserDashboard user={user} userData={userData} />;
                default: return <HomePage setPage={setPage} />;
            }
        }

        switch (page) {
            case 'login': return <LoginPage setPage={setPage} />;
            case 'signup': return <SignUpPage setPage={setPage} />;
            default: return <HomePage setPage={setPage} />;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
            <Navbar user={user} userData={userData} setPage={setPage} handleLogout={handleLogout} isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />
            <main className="pt-20">{renderPage()}</main>
        </div>
    );
}

// --- Navigation Component ---
function Navbar({ user, userData, setPage, handleLogout, isNavOpen, setIsNavOpen }) {
    const navLinks = [
        { name: 'Home', page: 'home' },
    ];
    
    const isLoggedIn = user && userData;
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

    const handleDonateClick = () => {
        setIsDonationModalOpen(true);
        setIsNavOpen(false); // Close mobile nav if open
    };

    const goToDashboard = () => {
        if (!userData) return;
        switch (userData.role) {
            case 'admin': setPage('adminDashboard'); break;
            case 'organization': setPage('orgDashboard'); break;
            case 'user': setPage('userDashboard'); break;
            default: setPage('home');
        }
    };

    return (
        <>
            <nav className="bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-rose-500 to-amber-500 cursor-pointer" onClick={() => setPage('home')}>
                                Shades of Hue
                            </span>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-center space-x-4">
                                {navLinks.map(link => (
                                    <a key={link.name} onClick={() => setPage(link.page)} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">{link.name}</a>
                                ))}
                                {isLoggedIn ? (
                                    <>
                                        <button onClick={goToDashboard} className="flex items-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                                            Dashboard
                                        </button>
                                        <span className="text-slate-600 px-3 py-2 rounded-md text-sm font-medium">
                                            Welcome, {userData?.name || 'User'}
                                        </span>
                                        <button onClick={handleLogout} className="flex items-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                                            <LogOut className="mr-2 h-4 w-4" /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setPage('login')} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">Login</button>
                                        <button onClick={() => setPage('signup')} className="bg-sky-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">Sign Up</button>
                                        <button onClick={handleDonateClick} className="bg-rose-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-rose-600 transition-colors flex items-center">
                                            <Heart className="mr-2" /> Donate
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setIsNavOpen(!isNavOpen)} className="text-slate-600 hover:text-slate-900 focus:outline-none">
                                {isNavOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
                {isNavOpen && (
                    <div className="md:hidden bg-white border-b border-slate-200">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navLinks.map(link => (
                                <a key={link.name} onClick={() => { setPage(link.page); setIsNavOpen(false); }} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium cursor-pointer">{link.name}</a>
                            ))}
                            {isLoggedIn ? (
                                <>
                                    <button onClick={() => { goToDashboard(); setIsNavOpen(false); }} className="w-full text-left flex items-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3 py-2 rounded-md text-base font-medium">
                                        Dashboard
                                    </button>
                                    <span className="text-slate-600 block px-3 py-2 rounded-md text-base font-medium">
                                        Welcome, {userData?.name || 'User'}
                                    </span>
                                    <button onClick={() => { handleLogout(); setIsNavOpen(false); }} className="w-full text-left flex items-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3 py-2 rounded-md text-base font-medium">
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { setPage('login'); setIsNavOpen(false); }} className="w-full text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium">Login</button>
                                    <button onClick={() => { setPage('signup'); setIsNavOpen(false); }} className="w-full mt-1 text-left bg-sky-600 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-sky-700 transition-colors">Sign Up</button>
                                    <button onClick={handleDonateClick} className="w-full mt-1 text-left bg-rose-500 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-rose-600 transition-colors flex items-center">
                                        <Heart className="mr-2" /> Donate
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
            <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
        </>
    );
}

// --- Page Components ---
function HomePage({ setPage }) {
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

    return (
        <>
            <div className="animate-fadeIn">
                {/* Hero Section */}
                <header className="relative text-center py-32 sm:py-48 px-4 bg-white">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-rose-500/10 to-amber-500/10"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900">
                            Connecting Pride, Empowering Voices
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600">
                            Shades of Hue is a dedicated platform for LGBTQIA+ individuals to find support, resources, and community from trusted organizations.
                        </p>
                        <div className="mt-8 flex justify-center gap-4 flex-wrap">
                            <button onClick={() => setPage('signup')} className="bg-sky-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-sky-700 transition-transform hover:scale-105">
                                Join as a User <ArrowRight className="inline ml-2" />
                            </button>
                            <button onClick={() => setIsDonationModalOpen(true)} className="bg-rose-500 text-white px-8 py-3 rounded-md font-semibold hover:bg-rose-600 transition-transform hover:scale-105 flex items-center">
                                <Heart className="mr-2" /> Make a Donation
                            </button>
                        </div>
                    </div>
                </header>

                {/* Mission & Vision Section */}
                <section className="py-20 bg-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-rose-500">Our Mission</h2>
                                <p className="mt-4 text-lg text-slate-600">
                                    To create a safe, inclusive, and empowering digital space that bridges the gap between LGBTQIA+ individuals seeking help and the organizations ready to provide it. We aim to foster connections, facilitate support, and build a stronger, more resilient community.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Our Vision</h2>
                                <p className="mt-4 text-lg text-slate-600">
                                    We envision a world where every LGBTQIA+ person has immediate access to the resources and support they need to thrive. A world where no one feels alone, and community is just a click away.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <TestimonialsSection />
                
                <footer className="bg-slate-200 py-8 text-center text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Shades of Hue. All rights reserved.</p>
                </footer>
            </div>
            <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
        </>
    );
}

function LoginPage({ setPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // The onAuthStateChanged listener in App will handle redirection
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error(err.code, err.message);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError("Invalid email or password. Please try again.");
            } else {
                setError("An unexpected error occurred. Please try again later.");
            }
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] animate-fadeIn">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-slate-900">Login to Your Account</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                        Login
                    </button>
                </form>
                <p className="text-sm text-center text-slate-500">
                    Don't have an account? <span onClick={() => setPage('signup')} className="font-medium text-sky-600 hover:underline cursor-pointer">Sign up</span>
                </p>
            </div>
        </div>
    );
}

function SignUpPage({ setPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        
        const role = email.toLowerCase() === "rajsimariaa@gmail.com" ? 'admin' : 'user';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const userData = {
                uid: user.uid, email: user.email, name: name, role: role,
                createdAt: Timestamp.now(), status: 'active'
            };

            await setDoc(doc(db, 'users', user.uid), userData);

            // The onAuthStateChanged listener in App will handle redirection
        } catch (err) {
            console.error(err.code, err.message);
            if (err.code === 'auth/email-already-in-use') {
                setError("This email address is already in use.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password is too weak. It should be at least 6 characters long.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Please enter a valid email address.");
            } else {
                setError("Failed to create an account. Please try again.");
            }
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] animate-fadeIn">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-slate-900">Create an Account</h2>
                <p className="text-center text-slate-500">Organizations and Admins are created by invitation only.</p>
                <form onSubmit={handleSignUp} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                        Sign Up
                    </button>
                </form>
                <p className="text-sm text-center text-slate-500">
                    Already have an account? <span onClick={() => setPage('login')} className="font-medium text-sky-600 hover:underline cursor-pointer">Login</span>
                </p>
            </div>
        </div>
    );
}

// --- Dashboards ---
function UserDashboard({ user, userData }) {
    const [view, setView] = useState('requests'); // requests, testimonials, or account
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {userData?.name}</h1>
            <p className="text-slate-500 mb-8">This is your personal dashboard.</p>
            
            <div className="mb-6 border-b border-slate-300">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setView('requests')} className={`${view === 'requests' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-400'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Help Requests
                    </button>
                    <button onClick={() => setView('testimonials')} className={`${view === 'testimonials' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-400'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        My Testimonials
                    </button>
                    <button onClick={() => setView('account')} className={`${view === 'account' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-400'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        My Account
                    </button>
                </nav>
            </div>

            {view === 'requests' && <UserRequestDashboard user={user} userData={userData} />}
            {view === 'testimonials' && <UserTestimonialsDashboard user={user} userData={userData} />}
            {view === 'account' && <MyAccountPage user={user} userData={userData} />}
        </div>
    );
}

function UserRequestDashboard({ user, userData }) {
    const [requests, setRequests] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [filteredOrgs, setFilteredOrgs] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [helpType, setHelpType] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);

    useEffect(() => {
        const orgsQuery = query(collection(db, "users"), where("role", "==", "organization"), where("status", "==", "active"));
        const unsubscribe = onSnapshot(orgsQuery, (snapshot) => {
            const allOrgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrganizations(allOrgs);
            setFilteredOrgs(allOrgs);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (helpType) {
            const filtered = organizations.filter(org => org.services && org.services.includes(helpType));
            setFilteredOrgs(filtered);
        } else {
            setFilteredOrgs(organizations);
        }
        setSelectedOrg(''); // Reset selected org when help type changes
    }, [helpType, organizations]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "requests"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userRequests = [];
            querySnapshot.forEach((doc) => {
                userRequests.push({ id: doc.id, ...doc.data() });
            });
            userRequests.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            setRequests(userRequests);
        }, (err) => console.error("Error fetching user requests:", err));
        return () => unsubscribe();
    }, [user]);

    const handleOpenPaymentModal = (e) => {
        e.preventDefault();
        if (!selectedOrg || !helpType || description.trim() === '') {
            setError('Please fill out all fields before proceeding to payment.');
            return;
        }
        setError('');
        setShowPaymentModal(true);
    };

    const handleRequestSubmit = async (transactionId) => {
        const selectedOrgData = organizations.find(org => org.id === selectedOrg);
        try {
            await addDoc(collection(db, "requests"), {
                userId: user.uid, userName: userData.name, requestText: description, 
                status: 'pending_payment_approval',
                createdAt: Timestamp.now(), selectedOrg: selectedOrg, orgName: selectedOrgData.orgName, helpType: helpType,
                transactionId: transactionId,
            });
            setSelectedOrg(''); setHelpType(''); setDescription('');
            setShowPaymentModal(false);
        } catch (err) { 
            setError('Failed to submit request.'); 
            console.error(err); 
        }
    };

    const openDeleteRequestModal = (request) => {
        setRequestToDelete(request);
    };

    const confirmDeleteRequest = async () => {
        if (!requestToDelete) return;
        try {
            await deleteDoc(doc(db, "requests", requestToDelete.id));
            setRequestToDelete(null);
        } catch (err) {
            console.error("Error deleting request:", err);
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'pending_payment_approval': return 'bg-orange-100 text-orange-800';
            case 'payment_rejected': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'declined': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const selectedOrgData = organizations.find(org => org.id === selectedOrg);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-slate-900">Submit a New Request</h2>
                        <form onSubmit={handleOpenPaymentModal} className="space-y-4">
                            <select value={helpType} onChange={e => setHelpType(e.target.value)} required className="w-full px-3 py-2 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                                <option value="" disabled>Choose a category...</option>
                                {helpCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} required className="w-full px-3 py-2 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" disabled={!helpType}>
                                <option value="" disabled>Choose an organization...</option>
                                {filteredOrgs.length > 0 ? filteredOrgs.map(org => <option key={org.id} value={org.id}>{org.orgName}</option>) : <option disabled>No organizations offer this service</option>}
                            </select>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the help you need..." rows="5" required className="w-full px-3 py-2 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">Proceed to Payment</button>
                        </form>
                    </div>
                </div>
                <div className="lg:col-span-2">
                     <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-slate-900">My Requests</h2>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {requests.length > 0 ? requests.map(req => (
                                <div key={req.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sky-600">{req.helpType}</p>
                                            <p className="text-sm text-slate-500">To: {req.orgName}</p>
                                            <p className="text-slate-700 mt-2">{req.requestText}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(req.status)}`}>{req.status.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                                        <p className="text-xs text-slate-400">{req.createdAt.toDate().toLocaleString()}</p>
                                        {(req.status === 'pending_payment_approval' || req.status === 'payment_rejected' || req.status === 'pending') && (
                                            <button onClick={() => openDeleteRequestModal(req)} className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1">
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        )}
                                    </div>
                                    {req.status === 'payment_rejected' && req.rejectionReason && (<div className="mt-2 p-3 bg-red-100 rounded-md"><p className="text-sm font-semibold text-red-800">Rejection Reason:</p><p className="text-sm text-red-700">{req.rejectionReason}</p></div>)}
                                    {req.status === 'declined' && req.declineReason && (<div className="mt-2 p-3 bg-red-100 rounded-md"><p className="text-sm font-semibold text-red-800">Reason for Decline:</p><p className="text-sm text-red-700">{req.declineReason}</p></div>)}
                                    {req.status === 'accepted' && (<div className="mt-2 p-3 bg-green-100 rounded-md"><p className="text-sm font-semibold text-green-800">Accepted by:</p><p className="text-sm text-green-700">{req.orgName}</p></div>)}
                                </div>
                            )) : (<p className="text-slate-500">You have no submitted requests.</p>)}
                        </div>
                    </div>
                </div>
            </div>
            {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} onSubmit={handleRequestSubmit} />}
            <ConfirmationModal
                isOpen={!!requestToDelete}
                onClose={() => setRequestToDelete(null)}
                onConfirm={confirmDeleteRequest}
                title="Confirm Request Deletion"
            >
                <p>Are you sure you want to delete this help request? This action cannot be undone.</p>
            </ConfirmationModal>
        </>
    );
}

function UserTestimonialsDashboard({ user, userData }) {
    const [testimonialText, setTestimonialText] = useState('');
    const [myTestimonials, setMyTestimonials] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [testimonialToDelete, setTestimonialToDelete] = useState(null);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "testimonials"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userTestimonials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyTestimonials(userTestimonials);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (testimonialText.trim().length < 20) {
            setError("Testimonial must be at least 20 characters long.");
            return;
        }
        try {
            await addDoc(collection(db, "testimonials"), {
                userId: user.uid,
                userName: userData.name,
                text: testimonialText,
                createdAt: Timestamp.now(),
                status: 'pending' // 'pending', 'approved'
            });
            setTestimonialText('');
            setSuccess('Thank you! Your testimonial has been submitted for review.');
        } catch (err) {
            setError('Failed to submit testimonial. Please try again.');
            console.error(err);
        }
    };
    
    const openDeleteTestimonialModal = (testimonial) => {
        setTestimonialToDelete(testimonial);
    };

    const confirmDeleteTestimonial = async () => {
        if (!testimonialToDelete) return;
        try {
            await deleteDoc(doc(db, "testimonials", testimonialToDelete.id));
            setTestimonialToDelete(null);
        } catch (err) {
            console.error("Error deleting testimonial:", err);
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-slate-900">Share Your Story</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <textarea value={testimonialText} onChange={(e) => setTestimonialText(e.target.value)} placeholder="Share your positive experience with our community..." rows="8" required className="w-full px-3 py-2 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            {success && <p className="text-green-500 text-sm">{success}</p>}
                            <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">Submit Testimonial</button>
                        </form>
                    </div>
                </div>
                <div className="lg:col-span-2">
                     <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-slate-900">My Submitted Testimonials</h2>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {myTestimonials.length > 0 ? myTestimonials.map(t => (
                                <div key={t.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <p className="text-slate-700 italic">"{t.text}"</p>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(t.status)}`}>{t.status}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                                        <p className="text-xs text-slate-400">{t.createdAt.toDate().toLocaleString()}</p>
                                        <button onClick={() => openDeleteTestimonialModal(t)} className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1">
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            )) : (<p className="text-slate-500">You have not submitted any testimonials yet.</p>)}
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={!!testimonialToDelete}
                onClose={() => setTestimonialToDelete(null)}
                onConfirm={confirmDeleteTestimonial}
                title="Confirm Testimonial Deletion"
            >
                <p>Are you sure you want to delete this testimonial? This action cannot be undone.</p>
            </ConfirmationModal>
        </>
    );
}

function OrganizationDashboard({ user, userData }) {
    const [view, setView] = useState('pending'); // pending, actioned, profile, account
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [declineReason, setDeclineReason] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        const q = query(collection(db, "requests"), where("selectedOrg", "==", user.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedRequests = [];
            querySnapshot.forEach((doc) => {
                fetchedRequests.push({ id: doc.id, ...doc.data() });
            });
            fetchedRequests.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            setRequests(fetchedRequests);
        }, (err) => {
            console.error("Error fetching org requests:", err);
        });
        return () => unsubscribe();
    }, [user]);

    const handleAccept = async (reqId) => {
        const reqRef = doc(db, 'requests', reqId);
        await updateDoc(reqRef, {
            status: 'accepted',
            progress: 'Not Started', // Initialize progress
            actionedByOrgId: user.uid,
            actionedByOrgName: userData.orgName,
            actionedAt: Timestamp.now()
        });
    };

    const handleProgressChange = async (reqId, newProgress) => {
        const reqRef = doc(db, 'requests', reqId);
        await updateDoc(reqRef, { progress: newProgress });
    };

    const openDeclineModal = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleDecline = async () => {
        if (!selectedRequest || declineReason.trim() === '') return;
        const reqRef = doc(db, 'requests', selectedRequest.id);
        await updateDoc(reqRef, {
            status: 'declined',
            declineReason: declineReason,
            actionedByOrgId: user.uid,
            actionedByOrgName: userData.orgName,
            actionedAt: Timestamp.now()
        });
        setIsModalOpen(false);
        setDeclineReason('');
        setSelectedRequest(null);
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'declined': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const displayedRequests = requests.filter(req => {
        if (view === 'pending') return req.status === 'pending';
        if (view === 'actioned') return req.status === 'accepted' || req.status === 'declined';
        return false;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Organization Dashboard</h1>
            <p className="text-slate-500 mb-8">Welcome, {userData?.orgName}.</p>
            
            <div className="mb-6 border-b border-slate-300">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setView('pending')} className={`${view === 'pending' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-400'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Pending Requests
                    </button>
                    <button onClick={() => setView('actioned')} className={`${view === 'actioned' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-400'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Actioned Requests
                    </button>
                    <button onClick={() => setView('profile')} className={`${view === 'profile' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-400'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        My Profile
                    </button>
                    <button onClick={() => setView('account')} className={`${view === 'account' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-400'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        My Account
                    </button>
                </nav>
            </div>

            {view === 'profile' ? (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-slate-900">My Profile</h2>
                        <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700">
                            <Edit size={16} /> Edit Profile
                        </button>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">Organization Name</h3>
                        <p className="text-slate-600 mb-4">{userData?.orgName}</p>
                        <h3 className="font-semibold text-slate-800">Services We Offer</h3>
                        <ul className="list-disc list-inside space-y-2 mt-2">
                            {userData?.services?.map(service => <li key={service} className="text-slate-600">{service}</li>)}
                        </ul>
                    </div>
                </div>
            ) : view === 'account' ? (
                <MyAccountPage user={user} userData={userData} />
            ) : (
                <div className="space-y-4">
                    {displayedRequests.length > 0 ? displayedRequests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <p className="font-semibold text-sky-600">{req.helpType}</p>
                                    <p className="text-slate-700 mt-2">{req.requestText}</p>
                                 </div>
                                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(req.status)}`}>
                                    {req.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm text-slate-500">From: {req.userName}</p>
                                    <p className="text-xs text-slate-400">{req.createdAt.toDate().toLocaleString()}</p>
                                </div>
                                {view === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAccept(req.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-semibold">Accept</button>
                                        <button onClick={() => openDeclineModal(req)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-semibold">Decline</button>
                                    </div>
                                )}
                            </div>
                             {req.status === 'accepted' && (
                                <div className="mt-4 border-t border-slate-200 pt-2 flex items-center gap-2">
                                    <label className="text-sm font-medium">Progress:</label>
                                    <select value={req.progress || 'Not Started'} onChange={e => handleProgressChange(req.id, e.target.value)} className="bg-slate-100 border border-slate-300 rounded p-1 text-sm">
                                        <option>Not Started</option>
                                        <option>In Progress</option>
                                        <option>Completed</option>
                                    </select>
                                </div>
                            )}
                             {req.status === 'declined' && req.declineReason && (
                                <div className="mt-2 p-3 bg-red-100 rounded-md">
                                    <p className="text-sm font-semibold text-red-800">Reason for Decline:</p>
                                    <p className="text-sm text-red-700">{req.declineReason}</p>
                                </div>
                            )}
                        </div>
                    )) : (
                        <p className="text-slate-500">No requests in this category.</p>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900">Reason for Decline</h3>
                        <textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Please provide a reason..."
                            rows="4"
                            className="w-full px-3 py-2 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        ></textarea>
                        <div className="flex justify-end gap-4 mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-md text-sm">Cancel</button>
                            <button onClick={handleDecline} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold">Confirm Decline</button>
                        </div>
                    </div>
                </div>
            )}
            {isProfileModalOpen && <EditOrgServicesModal org={userData} onUpdate={async (id, name, services) => { await updateDoc(doc(db, 'users', id), { name, orgName: name, services }); setIsProfileModalOpen(false); }} onClose={() => setIsProfileModalOpen(false)} />}
        </div>
    );
}

function AdminDashboard({ user, userData }) {
    const [view, setView] = useState('overview');
    const [users, setUsers] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [requests, setRequests] = useState([]);
    const [donations, setDonations] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    
    const [modalState, setModalState] = useState({ isOpen: false, id: null, name: '' });

    useEffect(() => {
        const usersQuery = query(collection(db, "users"), where("role", "==", "user"));
        const orgsQuery = query(collection(db, "users"), where("role", "==", "organization"));
        const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"));
        const requestsQuery = query(collection(db, "requests"));
        const donationsQuery = query(collection(db, "donations"));
        const testimonialsQuery = query(collection(db, "testimonials"));

        const unsubUsers = onSnapshot(usersQuery, snapshot => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubOrgs = onSnapshot(orgsQuery, snapshot => setOrgs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubAdmins = onSnapshot(adminsQuery, snapshot => setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubRequests = onSnapshot(requestsQuery, snapshot => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            reqs.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            setRequests(reqs);
        });
        const unsubDonations = onSnapshot(donationsQuery, snapshot => {
            const dons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dons.sort((a, b) => b.donatedAt.toDate() - a.donatedAt.toDate());
            setDonations(dons);
        });
        const unsubTestimonials = onSnapshot(testimonialsQuery, snapshot => {
            const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            tests.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            setTestimonials(tests);
        });

        return () => { unsubUsers(); unsubOrgs(); unsubAdmins(); unsubRequests(); unsubDonations(); unsubTestimonials(); };
    }, []);

    const openDeactivateModal = (id, name) => {
        setModalState({ isOpen: true, id, name });
    };

    const confirmDeactivate = async () => {
        if (!modalState.id) return;
        try {
            await updateDoc(doc(db, 'users', modalState.id), { status: 'deactivated' });
            console.log('Profile deactivated.');
        } catch (error) {
            console.error("Error deactivating profile:", error);
        } finally {
            setModalState({ isOpen: false, id: null, name: '' });
        }
    };
    
    const renderContent = () => {
        switch(view) {
            case 'overview': return <AdminStats users={users} orgs={orgs} requests={requests} />;
            case 'users': return <UserManagementTable users={users} onDeactivate={openDeactivateModal} />;
            case 'orgs': return <OrgManagementTable orgs={orgs} onDeactivate={openDeactivateModal} />;
            case 'admins': return <AdminManagementTable admins={admins} currentAdminId={user.uid} onDeactivate={openDeactivateModal} />;
            case 'requests': return <RequestLog requests={requests} />;
            case 'donations': return <DonationLog donations={donations} />;
            case 'testimonials': return <TestimonialManagement testimonials={testimonials} />;
            case 'payment_approvals': return <PaymentApprovalDashboard requests={requests.filter(r => r.status === 'pending_payment_approval')} />;
            case 'account': return <MyAccountPage user={user} userData={userData} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-500 mb-8">Full oversight and management of the platform.</p>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <nav className="flex flex-col space-y-2 bg-white p-4 rounded-lg shadow-lg">
                        <button onClick={() => setView('overview')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'overview' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <BarChart2 className="mr-3" /> Platform Overview
                        </button>
                        <button onClick={() => setView('payment_approvals')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'payment_approvals' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <CheckCircle className="mr-3" /> Payment Approval
                        </button>
                        <button onClick={() => setView('users')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'users' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <User className="mr-3" /> User Management
                        </button>
                        <button onClick={() => setView('orgs')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'orgs' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <Building className="mr-3" /> Organization Mngmt
                        </button>
                        <button onClick={() => setView('admins')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'admins' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <UserCog className="mr-3" /> Admin Management
                        </button>
                        <button onClick={() => setView('requests')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'requests' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <Shield className="mr-3" /> All Requests
                        </button>
                        <button onClick={() => setView('donations')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'donations' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <Heart className="mr-3" /> Donations
                        </button>
                        <button onClick={() => setView('testimonials')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'testimonials' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <MessageSquare className="mr-3" /> Testimonials
                        </button>
                         <button onClick={() => setView('account')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'account' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <UserCog className="mr-3" /> My Account
                        </button>
                    </nav>
                </aside>
                <main className="flex-1 bg-white p-6 rounded-lg shadow-lg relative">
                    {renderContent()}
                </main>
            </div>
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, id: null, name: '' })}
                onConfirm={confirmDeactivate}
                title="Confirm Deactivation"
            >
                <p>Are you sure you want to deactivate <strong>{modalState.name}</strong>? This action is irreversible.</p>
            </ConfirmationModal>
        </div>
    );
}

// --- Admin Sub-Components ---

function CreateUserForm({ role }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [services, setServices] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleServiceChange = (service) => {
        setServices(prev => 
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        
        const tempAppName = `secondary-auth-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const user = userCredential.user;
            
            const userData = {
                uid: user.uid,
                email: email,
                name: name,
                role: role,
                createdAt: Timestamp.now(),
                status: 'active'
            };
            if (role === 'organization') {
                userData.orgName = name;
                userData.services = services;
            }

            await setDoc(doc(db, 'users', user.uid), userData);
            
            setMessage({ type: 'success', text: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully!` });
            setName(''); setEmail(''); setPassword(''); setServices([]);
            
            await signOut(tempAuth);

        } catch (error) {
            console.error(`Error creating ${role}:`, error);
            setMessage({ type: 'error', text: `Failed to create ${role}: ${error.message}` });
        }
    };

    return (
        <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-900">Create New {role.charAt(0).toUpperCase() + role.slice(1)}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder={role === 'organization' ? "Organization Name" : 'Full Name'} value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    <input type="password" placeholder="Temporary Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                {role === 'organization' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Services Offered</label>
                        <div className="grid grid-cols-2 gap-2">
                            {helpCategories.map(cat => (
                                <label key={cat} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={services.includes(cat)} onChange={() => handleServiceChange(cat)} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                                    <span className="text-sm text-slate-600">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700">Create {role.charAt(0).toUpperCase() + role.slice(1)}</button>
            </form>
            {message.text && <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{message.text}</p>}
        </div>
    );
}

function UserManagementTable({ users, onDeactivate }) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Manage Users</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-100 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="px-6 py-4">{u.name}</td>
                                <td className="px-6 py-4">{u.email}</td>
                                <td className="px-6 py-4">{u.createdAt.toDate().toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.status}</span>
                                </td>
                                <td className="px-6 py-4">
                                    {u.status === 'active' && <button onClick={() => onDeactivate(u.id, u.name)} className="font-medium text-red-600 hover:underline">Deactivate</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function OrgManagementTable({ orgs, onDeactivate }) {
    const [editingOrg, setEditingOrg] = useState(null);

    const handleEdit = (org) => {
        setEditingOrg(org);
    };

    const handleUpdateServices = async (orgId, newServices) => {
        const docRef = doc(db, 'users', orgId);
        await updateDoc(docRef, { services: newServices });
        setEditingOrg(null);
    };

    return (
        <div>
            <CreateUserForm role="organization" />
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Manage Organizations</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-slate-600">
                     <thead className="bg-slate-100 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Services</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orgs.map(org => (
                            <tr key={org.id} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="px-6 py-4">{org.orgName}</td>
                                <td className="px-6 py-4">{org.email}</td>
                                <td className="px-6 py-4 text-xs">{(org.services || []).join(', ')}</td>
                                <td className="px-6 py-4 flex gap-4">
                                    <button onClick={() => handleEdit(org)} className="font-medium text-sky-600 hover:underline"><Edit size={16} /></button>
                                    {org.status === 'active' && <button onClick={() => onDeactivate(org.id, org.orgName)} className="font-medium text-red-600 hover:underline">Deactivate</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingOrg && <EditOrgServicesModal org={editingOrg} onClose={() => setEditingOrg(null)} onUpdate={handleUpdateServices} />}
        </div>
    );
}

function AdminManagementTable({ admins, currentAdminId, onDeactivate }) {
    return (
        <div>
            <CreateUserForm role="admin" />
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Manage Administrators</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-slate-600">
                     <thead className="bg-slate-100 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(admin => (
                            <tr key={admin.id} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="px-6 py-4">{admin.name}</td>
                                <td className="px-6 py-4">{admin.email}</td>
                                <td className="px-6 py-4">{admin.createdAt.toDate().toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    {admin.id !== currentAdminId ? (
                                        <button onClick={() => onDeactivate(admin.id, admin.name)} className="font-medium text-red-600 hover:underline">Deactivate</button>
                                    ) : (
                                        <span className="text-slate-400">Cannot deactivate self</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RequestLog({ requests }) {
     const getStatusChip = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'declined': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">All Platform Requests</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {requests.map(req => (
                    <div key={req.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold text-sky-600">{req.helpType}</p>
                                <p className="text-slate-700 mt-2 flex-1 pr-4">{req.requestText}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(req.status)}`}>{req.status}</span>
                        </div>
                        <div className="text-xs text-slate-500 space-y-1 border-t border-slate-200 pt-2 mt-2">
                            <p>User: {req.userName}</p>
                            <p>To Org: {req.orgName}</p>
                            <p>Requested: {req.createdAt.toDate().toLocaleString()}</p>
                            {req.actionedAt && <p>Actioned By: {req.actionedByOrgName} on {req.actionedAt.toDate().toLocaleString()}</p>}
                        </div>
                         {req.status === 'declined' && req.declineReason && (
                            <div className="mt-2 p-2 bg-red-50 rounded-md">
                                <p className="text-xs text-red-800">Decline Reason: {req.declineReason}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function DonationLog({ donations }) {
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonations = donations.length;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Donation Tracking</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                        <DollarSign className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Raised</p>
                        <p className="text-2xl font-bold text-slate-900">₹{totalAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center">
                    <div className="bg-rose-100 p-3 rounded-full mr-4">
                        <Heart className="text-rose-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Donations</p>
                        <p className="text-2xl font-bold text-slate-900">{totalDonations}</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-100 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Donor Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {donations.map(d => (
                            <tr key={d.id} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="px-6 py-4">{d.donorName || 'Anonymous'}</td>
                                <td className="px-6 py-4">{d.donorEmail || 'N/A'}</td>
                                <td className="px-6 py-4 font-semibold text-green-600">₹{d.amount.toFixed(2)}</td>
                                <td className="px-6 py-4">{d.donatedAt.toDate().toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TestimonialManagement({ testimonials }) {
    const handleApprove = async (id) => {
        const docRef = doc(db, 'testimonials', id);
        await updateDoc(docRef, { status: 'approved' });
    };

    const handleDecline = async (id) => {
        const docRef = doc(db, 'testimonials', id);
        await deleteDoc(docRef);
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Manage Testimonials</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {testimonials.map(t => (
                    <div key={t.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="italic text-slate-700">"{t.text}"</p>
                        <p className="text-sm text-slate-500 mt-2 font-semibold">- {t.userName}</p>
                        <div className="flex justify-between items-center mt-4 border-t border-slate-200 pt-2">
                            <p className="text-xs text-slate-400">{t.createdAt.toDate().toLocaleString()}</p>
                            {t.status === 'pending' ? (
                                <div className="flex gap-2">
                                    <button onClick={() => handleApprove(t.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-semibold">Approve</button>
                                    <button onClick={() => handleDecline(t.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold">Decline</button>
                                </div>
                            ) : (
                                <span className="text-xs font-bold text-green-600">Approved</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PaymentApprovalDashboard({ requests }) {
    const handleApprove = async (id) => {
        const docRef = doc(db, 'requests', id);
        await updateDoc(docRef, { status: 'pending' });
    };

    const handleReject = async (id) => {
        const docRef = doc(db, 'requests', id);
        await updateDoc(docRef, { status: 'payment_rejected', rejectionReason: 'Payment not confirmed.' });
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Payment Approvals</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {requests.length > 0 ? requests.map(req => (
                    <div key={req.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold text-sky-600">{req.helpType} for {req.userName}</p>
                                <p className="text-sm text-slate-500">To: {req.orgName}</p>
                                <p className="mt-2 text-slate-700"><strong>Transaction ID:</strong> {req.transactionId}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-semibold">Approve</button>
                                <button onClick={() => handleReject(req.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold">Reject</button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{req.createdAt.toDate().toLocaleString()}</p>
                    </div>
                )) : (
                    <p className="text-slate-500">No requests are pending payment approval.</p>
                )}
            </div>
        </div>
    );
}


// --- Reusable Modal Components ---
function ConfirmationModal({ isOpen, onClose, onConfirm, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4 text-slate-900">{title}</h3>
                <div className="text-slate-600 mb-6">{children}</div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-md text-sm font-semibold text-slate-800">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-semibold text-white">Confirm</button>
                </div>
            </div>
        </div>
    );
}

function DonationModal({ isOpen, onClose }) {
    const [amount, setAmount] = useState(250);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleDonate = async (e) => {
        e.preventDefault();
        if (amount <= 0) { setError('Please enter a valid amount.'); return; }
        setError(''); setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'donations'), {
                amount: Number(amount), donorName: name || 'Anonymous',
                donorEmail: email || null, donatedAt: Timestamp.now(),
            });
            setIsSuccess(true);
        } catch (err) { console.error("Error processing donation:", err); setError('Donation failed. Please try again.');
        } finally { setIsSubmitting(false); }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => { setIsSuccess(false); setAmount(250); setName(''); setEmail(''); setError(''); }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-4 relative">
                <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                {isSuccess ? (
                    <div className="text-center">
                        <Heart className="mx-auto text-rose-500 h-16 w-16 mb-4" />
                        <h3 className="text-2xl font-bold mb-2 text-slate-900">Thank You!</h3>
                        <p className="text-slate-600 mb-6">Your generous donation is greatly appreciated.</p>
                        <button onClick={handleClose} className="w-full py-2 px-4 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700">Close</button>
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold mb-4 text-slate-900">Make a Donation</h3>
                        <form onSubmit={handleDonate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Choose an amount</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[100, 250, 500].map(val => (<button key={val} type="button" onClick={() => setAmount(val)} className={`py-2 rounded-md font-semibold transition-colors ${amount === val ? 'bg-sky-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>₹{val}</button>))}
                                </div>
                                <div className="relative mt-4">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">₹</span>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full pl-7 pr-3 py-2 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Your Name (Optional)</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Anonymous" className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700">Email (Optional)</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For a receipt" className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 font-semibold text-white bg-rose-500 rounded-md hover:bg-rose-600 disabled:bg-slate-400 disabled:cursor-not-allowed flex justify-center items-center">
                                {isSubmitting ? 'Processing...' : `Donate ₹${amount}`}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "testimonials"), where("status", "==", "approved"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    if (testimonials.length === 0) {
        return null; // Don't render the section if there are no approved testimonials
    }

    return (
        <section className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-900">What Our Community Says</h2>
                    <p className="mt-4 text-lg text-slate-600">Real stories from the people we support.</p>
                </div>
                <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map(t => (
                        <div key={t.id} className="bg-slate-50 p-8 rounded-lg shadow-lg border border-slate-200">
                            <p className="italic text-slate-700">"{t.text}"</p>
                            <p className="mt-6 font-semibold text-sky-600">- {t.userName}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PaymentModal({ onClose, onSubmit }) {
    const [step, setStep] = useState(1);
    const [transactionId, setTransactionId] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNext = () => {
        setStep(2);
    };

    const handleFinalSubmit = async () => {
        if (transactionId.trim() === '') {
            setError('Please enter a valid Transaction ID.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            await onSubmit(transactionId);
        } catch (err) {
            console.error("Submission failed:", err);
            setError("Submission failed. Please try again.");
            setIsSubmitting(false); // Re-enable button on error
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-4 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900">Step 1: Make Payment</h2>
                        <p className="text-slate-600 mb-4">Please use the UPI ID below to make the payment for your request.</p>
                        <div className="text-center my-8">
                            <p className="text-slate-500">Pay to UPI ID:</p>
                            <p className="font-mono text-lg font-semibold text-sky-600 tracking-wider">rajsimariaa-2@okaxis</p>
                        </div>
                        <button onClick={handleNext} className="w-full mt-8 py-2 px-4 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700">
                            I Have Paid, Next Step
                        </button>
                    </div>
                )}
                {step === 2 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900">Step 2: Confirm Payment</h2>
                        <p className="text-slate-600 mb-4">Please provide the transaction details to help us verify your payment.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Transaction ID</label>
                                <input 
                                    type="text" 
                                    value={transactionId} 
                                    onChange={e => setTransactionId(e.target.value)} 
                                    required 
                                    placeholder="Enter the UPI transaction ID"
                                    className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" 
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>
                         <button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full mt-8 py-2 px-4 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Submitting...' : 'Submit Request for Approval'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function EditOrgServicesModal({ org, onClose, onUpdate }) {
    const [name, setName] = useState(org.orgName || '');
    const [services, setServices] = useState(org.services || []);

    const handleServiceChange = (service) => {
        setServices(prev => 
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        );
    };

    const handleSave = () => {
        onUpdate(org.id, name, services);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-4 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                <h2 className="text-2xl font-bold mb-4 text-slate-900">Edit Profile</h2>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Organization Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Services Offered</label>
                        <div className="grid grid-cols-2 gap-2">
                            {helpCategories.map(cat => (
                                <label key={cat} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={services.includes(cat)} onChange={() => handleServiceChange(cat)} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                                    <span className="text-sm text-slate-600">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-md text-sm font-semibold">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-sm font-semibold">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

function AdminStats({ users, orgs, requests }) {
    const activeUsers = users.filter(u => u.status === 'active').length;
    const activeOrgs = orgs.filter(o => o.status === 'active').length;
    const pendingPayment = requests.filter(r => r.status === 'pending_payment_approval').length;
    const pendingOrg = requests.filter(r => r.status === 'pending').length;
    const inProgress = requests.filter(r => r.progress === 'In Progress').length;
    const completed = requests.filter(r => r.progress === 'Completed').length;

    const stats = [
        { label: 'Active Users', value: activeUsers },
        { label: 'Active Organizations', value: activeOrgs },
        { label: 'Pending Payment', value: pendingPayment },
        { label: 'Pending Organization', value: pendingOrg },
        { label: 'In Progress', value: inProgress },
        { label: 'Completed Requests', value: completed },
    ];

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                        <p className="text-3xl font-bold text-sky-600">{stat.value}</p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MyAccountPage({ user, userData }) {
    const [name, setName] = useState(userData?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDetailsUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await updateDoc(doc(db, 'users', user.uid), { name: name });
            setSuccess('Your details have been updated successfully.');
        } catch (err) {
            setError('Failed to update details. Please try again.');
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password should be at least 6 characters long.");
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setSuccess('Password updated successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError('Failed to update password. Please check your current password and try again.');
        }
    };

    const handleDeleteAccount = async () => {
        setError('');
        try {
            const credential = EmailAuthProvider.credential(user.email, deletePassword);
            await reauthenticateWithCredential(user, credential);
            await deleteDoc(doc(db, 'users', user.uid));
            await deleteUser(user);
            // The onAuthStateChanged listener will handle logout and page redirect.
        } catch (err) {
            setError('Failed to delete account. Please check your password and try again.');
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-900">Edit Account Details</h2>
                <form onSubmit={handleDetailsUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <button type="submit" className="px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700">Save Changes</button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-900">Update Password</h2>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Current Password</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-100 border border-slate-300 rounded-md" />
                    </div>
                    <button type="submit" className="px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700">Update Password</button>
                </form>
            </div>

            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h2 className="text-xl font-semibold mb-2 text-red-800">Delete Account</h2>
                <p className="text-red-700 mb-4">This action is irreversible. All your data will be permanently deleted.</p>
                <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Delete My Account</button>
            </div>
            
            {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                title="Confirm Account Deletion"
            >
                <p>Are you sure you want to permanently delete your account? To confirm, please enter your password.</p>
                <input 
                    type="password" 
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 mt-4 text-slate-900 bg-slate-100 border border-slate-300 rounded-md"
                    placeholder="Enter your password"
                />
            </ConfirmationModal>
        </div>
    );
}
