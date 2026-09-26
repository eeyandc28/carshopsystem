import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
}).required();

const Login = () => {
    const { login, loading, error } = useAuthStore();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        const success = await login(data.email, data.password);
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="max-w-md w-full space-y-8 bg-slate-900 p-10 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="text-center">
                    <img 
                        src="/logo.png" 
                        alt="RADI8 - Precision. Reliability. Service." 
                        className="mx-auto h-20 w-auto rounded-xl shadow-lg border border-slate-700/60 object-contain"
                    />
                    <h2 className="mt-5 text-center text-2xl font-black tracking-tight text-white">
                        RADI8 System
                    </h2>
                    <p className="mt-1 text-center text-xs tracking-wider text-slate-400 font-medium uppercase">
                        Precision &bull; Reliability &bull; Service
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Email Address</label>
                            <input
                                {...register('email')}
                                type="email"
                                className="mt-1 block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your email"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Password</label>
                            <input
                                {...register('password')}
                                type="password"
                                className="mt-1 block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
