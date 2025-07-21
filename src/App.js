import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInAnonymously
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
import { ArrowRight, User, Building, Shield, LogOut, Heart, Menu, X, DollarSign, UserCog, MessageSquare } from 'lucide-react';

// --- IMPORTANT: Firebase Configuration ---
// Paste your Firebase project configuration object here.
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

// --- Main App Component ---
export default function App() {
    const [page, setPage] = useState('home');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNavOpen, setIsNavOpen] = useState(false);

    // --- Authentication State Observer ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser && !currentUser.isAnonymous) {
                setUser(currentUser);
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const fetchedUserData = userDocSnap.data();
                    if (fetchedUserData.status === 'deactivated') {
                        setUserData(null);
                        await signOut(auth);
                        setPage('login');
                    } else {
                        setUserData(fetchedUserData);
                    }
                } else {
                    setUserData(null);
                }
            } else {
                setUser(currentUser); 
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setPage('home');
    };
    
    const renderPage = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>;
        }

        switch (page) {
            case 'login': return <LoginPage setPage={setPage} />;
            case 'signup': return <SignUpPage setPage={setPage} />;
            case 'userDashboard': return <UserDashboard user={user} userData={userData} />;
            case 'orgDashboard': return <OrganizationDashboard user={user} userData={userData} />;
            case 'adminDashboard': return <AdminDashboard user={user} userData={userData} />;
            default: return <HomePage setPage={setPage} />;
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen text-gray-300 font-sans">
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
    
    const isLoggedIn = user && !user.isAnonymous;
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
            <nav className="bg-gray-900/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-green-400 cursor-pointer" onClick={() => setPage('home')}>
                                Shades of Hue
                            </span>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-center space-x-4">
                                {navLinks.map(link => (
                                    <a key={link.name} onClick={() => setPage(link.page)} className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">{link.name}</a>
                                ))}
                                {isLoggedIn ? (
                                    <>
                                        <button onClick={goToDashboard} className="flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                            Dashboard
                                        </button>
                                        <span className="text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                                            Welcome, {userData?.name || 'User'}
                                        </span>
                                        <button onClick={handleLogout} className="flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                            <LogOut className="mr-2 h-4 w-4" /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setPage('login')} className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Login</button>
                                        <button onClick={() => setPage('signup')} className="bg-fuchsia-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-fuchsia-700 transition-colors">Sign Up</button>
                                        <button onClick={handleDonateClick} className="bg-cyan-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cyan-600 transition-colors flex items-center">
                                            <Heart className="mr-2 h-4 w-4" /> Donate
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setIsNavOpen(!isNavOpen)} className="text-gray-300 hover:text-white focus:outline-none">
                                {isNavOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
                {isNavOpen && (
                    <div className="md:hidden bg-gray-800 border-b border-gray-700">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navLinks.map(link => (
                                <a key={link.name} onClick={() => { setPage(link.page); setIsNavOpen(false); }} className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer">{link.name}</a>
                            ))}
                            {isLoggedIn ? (
                                <>
                                    <button onClick={() => { goToDashboard(); setIsNavOpen(false); }} className="w-full text-left flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium">
                                        Dashboard
                                    </button>
                                    <span className="text-gray-300 block px-3 py-2 rounded-md text-base font-medium">
                                        Welcome, {userData?.name || 'User'}
                                    </span>
                                    <button onClick={() => { handleLogout(); setIsNavOpen(false); }} className="w-full text-left flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium">
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { setPage('login'); setIsNavOpen(false); }} className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Login</button>
                                    <button onClick={() => { setPage('signup'); setIsNavOpen(false); }} className="w-full mt-1 text-left bg-fuchsia-600 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-fuchsia-700 transition-colors">Sign Up</button>
                                    <button onClick={handleDonateClick} className="w-full mt-1 text-left bg-cyan-500 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-600 transition-colors flex items-center">
                                        <Heart className="mr-2 h-4 w-4" /> Donate
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
                <header 
                    className="relative text-center py-32 sm:py-48 px-4 bg-gray-900 bg-cover bg-center"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1561057399-4c73a0179a61?q=80&w=1974&auto=format&fit=crop')` }}
                >
                    <div className="absolute inset-0 bg-gray-900/70"></div> {/* Dark overlay for readability */}
                    <div className="relative z-10">
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-green-400">
                            Connecting Pride, Empowering Voices
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-200">
                            Shades of Hue is a dedicated platform for LGBTQIA+ individuals to find support, resources, and community from trusted organizations.
                        </p>
                        <div className="mt-8 flex justify-center gap-4 flex-wrap">
                            <button onClick={() => setPage('signup')} className="bg-fuchsia-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-fuchsia-700 transition-transform hover:scale-105">
                                Join as a User <ArrowRight className="inline ml-2" />
                            </button>
                            <button onClick={() => setIsDonationModalOpen(true)} className="bg-cyan-500 text-white px-8 py-3 rounded-md font-semibold hover:bg-cyan-600 transition-transform hover:scale-105 flex items-center">
                                <Heart className="mr-2" /> Make a Donation
                            </button>
                        </div>
                    </div>
                </header>

                {/* Mission & Vision Section */}
                <section className="py-20 bg-gray-800/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">Our Mission</h2>
                                <p className="mt-4 text-lg text-gray-300">
                                    To create a safe, inclusive, and empowering digital space that bridges the gap between LGBTQIA+ individuals seeking help and the organizations ready to provide it. We aim to foster connections, facilitate support, and build a stronger, more resilient community.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">Our Vision</h2>
                                <p className="mt-4 text-lg text-gray-300">
                                    We envision a world where every LGBTQIA+ person has immediate access to the resources and support they need to thrive. A world where no one feels alone, and community is just a click away.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <TestimonialsSection />
                
                <footer className="bg-gray-800/50 py-8 text-center text-gray-500">
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.role === 'admin') setPage('adminDashboard');
                else if (userData.role === 'organization') setPage('orgDashboard');
                else setPage('userDashboard');
            } else {
                setPage('home'); 
            }
        } catch (err) {
            setError("Failed to login. Please check your credentials.");
            console.error(err);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] animate-fadeIn">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-white">Login to Your Account</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-gray-800">
                        Login
                    </button>
                </form>
                <p className="text-sm text-center text-gray-400">
                    Don't have an account? <span onClick={() => setPage('signup')} className="font-medium text-fuchsia-400 hover:underline cursor-pointer">Sign up</span>
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

            if (userData.role === 'admin') setPage('adminDashboard');
            else setPage('userDashboard');

        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] animate-fadeIn">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-white">Create an Account</h2>
                <p className="text-center text-gray-400">Organizations and Admins are created by invitation only.</p>
                <form onSubmit={handleSignUp} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-gray-800">
                        Sign Up
                    </button>
                </form>
                <p className="text-sm text-center text-gray-400">
                    Already have an account? <span onClick={() => setPage('login')} className="font-medium text-fuchsia-400 hover:underline cursor-pointer">Login</span>
                </p>
            </div>
        </div>
    );
}

// --- Dashboards ---
function UserDashboard({ user, userData }) {
    const [view, setView] = useState('requests'); // requests or testimonials
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome, {userData?.name}</h1>
            <p className="text-gray-400 mb-8">This is your personal dashboard.</p>
            
            <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setView('requests')} className={`${view === 'requests' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Help Requests
                    </button>
                    <button onClick={() => setView('testimonials')} className={`${view === 'testimonials' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        My Testimonials
                    </button>
                </nav>
            </div>

            {view === 'requests' ? <UserRequestDashboard user={user} userData={userData} /> : <UserTestimonialsDashboard user={user} userData={userData} />}
        </div>
    );
}

function UserRequestDashboard({ user, userData }) {
    const [requests, setRequests] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [helpType, setHelpType] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const helpCategories = ["Mental Health Support", "Legal Advice", "Community Connection", "Housing Assistance", "Healthcare Services", "General Inquiry"];

    useEffect(() => {
        const orgsQuery = query(collection(db, "users"), where("role", "==", "organization"), where("status", "==", "active"));
        const unsubscribe = onSnapshot(orgsQuery, (snapshot) => {
            setOrganizations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);
    
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

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!selectedOrg || !helpType || description.trim() === '') {
            setError('Please fill out all fields.');
            return;
        }
        setError('');
        const selectedOrgData = organizations.find(org => org.id === selectedOrg);
        try {
            await addDoc(collection(db, "requests"), {
                userId: user.uid, userName: userData.name, requestText: description, status: 'pending',
                createdAt: Timestamp.now(), selectedOrg: selectedOrg, orgName: selectedOrgData.orgName, helpType: helpType,
            });
            setSelectedOrg(''); setHelpType(''); setDescription('');
        } catch (err) { setError('Failed to submit request.'); console.error(err); }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            case 'accepted': return 'bg-green-500/20 text-green-400';
            case 'declined': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">Submit a New Request</h2>
                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                            <option value="" disabled>Choose an organization...</option>
                            {organizations.map(org => <option key={org.id} value={org.id}>{org.orgName}</option>)}
                        </select>
                        <select value={helpType} onChange={e => setHelpType(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                            <option value="" disabled>Choose a category...</option>
                            {helpCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the help you need..." rows="5" required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"></textarea>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 transition-colors">Submit Request</button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2">
                 <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">My Requests</h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {requests.length > 0 ? requests.map(req => (
                            <div key={req.id} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-fuchsia-400">{req.helpType}</p>
                                        <p className="text-sm text-gray-400">To: {req.orgName}</p>
                                        <p className="text-gray-300 mt-2">{req.requestText}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(req.status)}`}>{req.status}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">{req.createdAt.toDate().toLocaleString()}</p>
                                {req.status === 'declined' && req.declineReason && (<div className="mt-2 p-3 bg-red-900/50 rounded-md"><p className="text-sm font-semibold text-red-300">Reason for Decline:</p><p className="text-sm text-red-400">{req.declineReason}</p></div>)}
                                {req.status === 'accepted' && (<div className="mt-2 p-3 bg-green-900/50 rounded-md"><p className="text-sm font-semibold text-green-300">Accepted by:</p><p className="text-sm text-green-400">{req.orgName}</p></div>)}
                            </div>
                        )) : (<p className="text-gray-400">You have no submitted requests.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserTestimonialsDashboard({ user, userData }) {
    const [testimonialText, setTestimonialText] = useState('');
    const [myTestimonials, setMyTestimonials] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
    
    const getStatusChip = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            case 'approved': return 'bg-green-500/20 text-green-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">Share Your Story</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea value={testimonialText} onChange={(e) => setTestimonialText(e.target.value)} placeholder="Share your positive experience with our community..." rows="8" required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"></textarea>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        {success && <p className="text-green-400 text-sm">{success}</p>}
                        <button type="submit" className="w-full py-2 px-4 font-semibold text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 transition-colors">Submit Testimonial</button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2">
                 <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">My Submitted Testimonials</h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {myTestimonials.length > 0 ? myTestimonials.map(t => (
                            <div key={t.id} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <p className="text-gray-300 italic">"{t.text}"</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(t.status)}`}>{t.status}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">{t.createdAt.toDate().toLocaleString()}</p>
                            </div>
                        )) : (<p className="text-gray-400">You have not submitted any testimonials yet.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrganizationDashboard({ user, userData }) {
    // ... Existing OrganizationDashboard code ...
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [declineReason, setDeclineReason] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [view, setView] = useState('pending');

    useEffect(() => {
        if (!user) return;
        let q;
        if (view === 'pending') {
            q = query(collection(db, "requests"), where("status", "==", "pending"), where("selectedOrg", "==", user.uid));
        } else {
            q = query(collection(db, "requests"), where("actionedByOrgId", "==", user.uid));
        }

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
    }, [user, view]);

    const handleAccept = async (reqId) => {
        const reqRef = doc(db, 'requests', reqId);
        await updateDoc(reqRef, {
            status: 'accepted',
            actionedByOrgId: user.uid,
            actionedByOrgName: userData.orgName,
            actionedAt: Timestamp.now()
        });
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
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            case 'accepted': return 'bg-green-500/20 text-green-400';
            case 'declined': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Organization Dashboard</h1>
            <p className="text-gray-400 mb-8">Welcome, {userData?.orgName}. Review and respond to user requests.</p>
            
            <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setView('pending')} className={`${view === 'pending' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Pending Requests
                    </button>
                    <button onClick={() => setView('actioned')} className={`${view === 'actioned' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Actioned Requests
                    </button>
                </nav>
            </div>

            <div className="space-y-4">
                {requests.length > 0 ? requests.map(req => (
                    <div key={req.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <p className="font-semibold text-fuchsia-400">{req.helpType}</p>
                                <p className="text-gray-300 mt-2">{req.requestText}</p>
                             </div>
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(req.status)}`}>
                                {req.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm text-gray-400">From: {req.userName}</p>
                                <p className="text-xs text-gray-500">{req.createdAt.toDate().toLocaleString()}</p>
                            </div>
                            {view === 'pending' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleAccept(req.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-semibold">Accept</button>
                                    <button onClick={() => openDeclineModal(req)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-semibold">Decline</button>
                                </div>
                            )}
                        </div>
                         {req.status === 'declined' && req.declineReason && (
                            <div className="mt-2 p-3 bg-red-900/50 rounded-md">
                                <p className="text-sm font-semibold text-red-300">Reason for Decline:</p>
                                <p className="text-sm text-red-400">{req.declineReason}</p>
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-gray-400">No requests in this category.</p>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4 text-white">Reason for Decline</h3>
                        <textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Please provide a reason..."
                            rows="4"
                            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        ></textarea>
                        <div className="flex justify-end gap-4 mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Cancel</button>
                            <button onClick={handleDecline} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-semibold">Confirm Decline</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminDashboard({ user, userData }) {
    const [view, setView] = useState('users');
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
            const userRef = doc(db, 'users', modalState.id);
            await updateDoc(userRef, { status: 'deactivated' });
            console.log('Profile deactivated.');
        } catch (error) {
            console.error("Error deactivating profile:", error);
        } finally {
            setModalState({ isOpen: false, id: null, name: '' });
        }
    };
    
    const renderContent = () => {
        switch(view) {
            case 'users': return <UserManagementTable users={users} onDeactivate={openDeactivateModal} />;
            case 'orgs': return <OrgManagementTable orgs={orgs} onDeactivate={openDeactivateModal} />;
            case 'admins': return <AdminManagementTable admins={admins} currentAdminId={user.uid} onDeactivate={openDeactivateModal} />;
            case 'requests': return <RequestLog requests={requests} />;
            case 'donations': return <DonationLog donations={donations} />;
            case 'testimonials': return <TestimonialManagement testimonials={testimonials} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400 mb-8">Full oversight and management of the platform.</p>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <nav className="flex flex-col space-y-2 bg-gray-800 p-4 rounded-lg shadow-lg">
                        <button onClick={() => setView('users')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'users' ? 'bg-fuchsia-600 text-white' : 'hover:bg-gray-700'}`}>
                            <User className="mr-3" /> User Management
                        </button>
                        <button onClick={() => setView('orgs')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'orgs' ? 'bg-fuchsia-600 text-white' : 'hover:bg-gray-700'}`}>
                            <Building className="mr-3" /> Organization Mngmt
                        </button>
                        <button onClick={() => setView('admins')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'admins' ? 'bg-fuchsia-600 text-white' : 'hover:bg-gray-700'}`}>
                            <UserCog className="mr-3" /> Admin Management
                        </button>
                        <button onClick={() => setView('requests')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'requests' ? 'bg-fuchsia-600 text-white' : 'hover:bg-gray-700'}`}>
                            <Shield className="mr-3" /> All Requests
                        </button>
                        <button onClick={() => setView('donations')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'donations' ? 'bg-fuchsia-600 text-white' : 'hover:bg-gray-700'}`}>
                            <Heart className="mr-3" /> Donations
                        </button>
                        <button onClick={() => setView('testimonials')} className={`flex items-center p-3 rounded-lg transition-colors ${view === 'testimonials' ? 'bg-fuchsia-600 text-white' : 'hover:bg-gray-700'}`}>
                            <MessageSquare className="mr-3" /> Testimonials
                        </button>
                    </nav>
                </aside>
                <main className="flex-1 bg-gray-800 p-6 rounded-lg shadow-lg relative">
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
    const [message, setMessage] = useState({ type: '', text: '' });

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
            if (role === 'organization') userData.orgName = name;

            await setDoc(doc(db, 'users', user.uid), userData);
            
            setMessage({ type: 'success', text: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully!` });
            setName(''); setEmail(''); setPassword('');
            
            await signOut(tempAuth);

        } catch (error) {
            console.error(`Error creating ${role}:`, error);
            setMessage({ type: 'error', text: `Failed to create ${role}: ${error.message}` });
        }
    };

    return (
        <div className="mb-8 p-6 bg-gray-700/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-white">Create New {role.charAt(0).toUpperCase() + role.slice(1)}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder={role === 'organization' ? "Organization Name" : 'Full Name'} value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                <input type="password" placeholder="Temporary Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                <button type="submit" className="md:col-span-2 w-full py-2 px-4 font-semibold text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700">Create {role.charAt(0).toUpperCase() + role.slice(1)}</button>
            </form>
            {message.text && <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
        </div>
    );
}

function UserManagementTable({ users, onDeactivate }) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Manage Users</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="bg-gray-700 text-xs uppercase">
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
                            <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                <td className="px-6 py-4">{u.name}</td>
                                <td className="px-6 py-4">{u.email}</td>
                                <td className="px-6 py-4">{u.createdAt.toDate().toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${u.status === 'active' ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>{u.status}</span>
                                </td>
                                <td className="px-6 py-4">
                                    {u.status === 'active' && <button onClick={() => onDeactivate(u.id, u.name)} className="font-medium text-red-400 hover:underline">Deactivate</button>}
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
    return (
        <div>
            <CreateUserForm role="organization" />
            <h2 className="text-xl font-semibold mb-4 text-white">Manage Organizations</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                     <thead className="bg-gray-700 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orgs.map(org => (
                            <tr key={org.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                <td className="px-6 py-4">{org.orgName}</td>
                                <td className="px-6 py-4">{org.email}</td>
                                <td className="px-6 py-4">{org.createdAt.toDate().toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${org.status === 'active' ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>{org.status}</span>
                                </td>
                                <td className="px-6 py-4">
                                    {org.status === 'active' && <button onClick={() => onDeactivate(org.id, org.orgName)} className="font-medium text-red-400 hover:underline">Deactivate</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AdminManagementTable({ admins, currentAdminId, onDeactivate }) {
    return (
        <div>
            <CreateUserForm role="admin" />
            <h2 className="text-xl font-semibold mb-4 text-white">Manage Administrators</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                     <thead className="bg-gray-700 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(admin => (
                            <tr key={admin.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                <td className="px-6 py-4">{admin.name}</td>
                                <td className="px-6 py-4">{admin.email}</td>
                                <td className="px-6 py-4">{admin.createdAt.toDate().toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    {admin.id !== currentAdminId ? (
                                        <button onClick={() => onDeactivate(admin.id, admin.name)} className="font-medium text-red-400 hover:underline">Deactivate</button>
                                    ) : (
                                        <span className="text-gray-500">Cannot deactivate self</span>
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
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            case 'accepted': return 'bg-green-500/20 text-green-400';
            case 'declined': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-white">All Platform Requests</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {requests.map(req => (
                    <div key={req.id} className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold text-fuchsia-400">{req.helpType}</p>
                                <p className="text-gray-300 mt-2 flex-1 pr-4">{req.requestText}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(req.status)}`}>
                                {req.status}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1 border-t border-gray-600 pt-2 mt-2">
                            <p>User: {req.userName}</p>
                            <p>To Org: {req.orgName}</p>
                            <p>Requested: {req.createdAt.toDate().toLocaleString()}</p>
                            {req.actionedAt && <p>Actioned By: {req.actionedByOrgName} on {req.actionedAt.toDate().toLocaleString()}</p>}
                        </div>
                         {req.status === 'declined' && req.declineReason && (
                            <div className="mt-2 p-2 bg-red-900/30 rounded-md">
                                <p className="text-xs text-red-300">Decline Reason: {req.declineReason}</p>
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
            <h2 className="text-xl font-semibold mb-4 text-white">Donation Tracking</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700/50 p-4 rounded-lg flex items-center">
                    <div className="bg-green-500/20 p-3 rounded-full mr-4">
                        <DollarSign className="text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Total Raised</p>
                        <p className="text-2xl font-bold text-white">${totalAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg flex items-center">
                    <div className="bg-fuchsia-500/20 p-3 rounded-full mr-4">
                        <Heart className="text-fuchsia-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Total Donations</p>
                        <p className="text-2xl font-bold text-white">{totalDonations}</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="bg-gray-700 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Donor Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {donations.map(d => (
                            <tr key={d.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                <td className="px-6 py-4">{d.donorName || 'Anonymous'}</td>
                                <td className="px-6 py-4">{d.donorEmail || 'N/A'}</td>
                                <td className="px-6 py-4 font-semibold text-green-400">${d.amount.toFixed(2)}</td>
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
            <h2 className="text-xl font-semibold mb-4 text-white">Manage Testimonials</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {testimonials.map(t => (
                    <div key={t.id} className="bg-gray-700/50 p-4 rounded-lg">
                        <p className="italic text-gray-300">"{t.text}"</p>
                        <p className="text-sm text-gray-400 mt-2 font-semibold">- {t.userName}</p>
                        <div className="flex justify-between items-center mt-4 border-t border-gray-600 pt-2">
                            <p className="text-xs text-gray-500">{t.createdAt.toDate().toLocaleString()}</p>
                            {t.status === 'pending' ? (
                                <div className="flex gap-2">
                                    <button onClick={() => handleApprove(t.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-semibold">Approve</button>
                                    <button onClick={() => handleDecline(t.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold">Decline</button>
                                </div>
                            ) : (
                                <span className="text-xs font-bold text-green-400">Approved</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// --- Reusable Modal Components ---
function ConfirmationModal({ isOpen, onClose, onConfirm, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
                <div className="text-gray-300 mb-6">{children}</div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm font-semibold text-white">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-semibold text-white">Confirm</button>
                </div>
            </div>
        </div>
    );
}

function DonationModal({ isOpen, onClose }) {
    const [amount, setAmount] = useState(25);
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
        setTimeout(() => { setIsSuccess(false); setAmount(25); setName(''); setEmail(''); setError(''); }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-4 relative">
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
                {isSuccess ? (
                    <div className="text-center">
                        <Heart className="mx-auto text-cyan-400 h-16 w-16 mb-4" />
                        <h3 className="text-2xl font-bold mb-2 text-white">Thank You!</h3>
                        <p className="text-gray-300 mb-6">Your generous donation is greatly appreciated.</p>
                        <button onClick={handleClose} className="w-full py-2 px-4 font-semibold text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700">Close</button>
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold mb-4 text-white">Make a Donation</h3>
                        <form onSubmit={handleDonate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Choose an amount</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[10, 25, 50].map(val => (<button key={val} type="button" onClick={() => setAmount(val)} className={`py-2 rounded-md font-semibold transition-colors ${amount === val ? 'bg-fuchsia-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>${val}</button>))}
                                </div>
                                <div className="relative mt-4">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full pl-7 pr-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Your Name (Optional)</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Anonymous" className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300">Email (Optional)</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For a receipt" className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 font-semibold text-white bg-cyan-500 rounded-md hover:bg-cyan-600 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center">
                                {isSubmitting ? 'Processing...' : `Donate $${amount}`}
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
        <section className="py-20 bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">What Our Community Says</h2>
                    <p className="mt-4 text-lg text-gray-400">Real stories from the people we support.</p>
                </div>
                <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map(t => (
                        <div key={t.id} className="bg-gray-800 p-8 rounded-lg shadow-lg">
                            <p className="text-gray-300 italic">"{t.text}"</p>
                            <p className="mt-6 font-semibold text-fuchsia-400">- {t.userName}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
