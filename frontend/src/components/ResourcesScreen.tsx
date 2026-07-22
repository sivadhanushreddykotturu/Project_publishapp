import { useEffect, useState } from 'react';
import { Search, Smartphone, Cpu, CheckCircle2, Clock, Wrench, RefreshCw } from 'lucide-react';
import { AndroidDevice } from '../types';
import { listPublicTesterDirectory } from '../lib/launchops-api';
import BlurText from './ui/BlurText';

interface ResourcesScreenProps {
  isDarkMode?: boolean;
}

export default function ResourcesScreen({ isDarkMode = false }: ResourcesScreenProps) {
  const [devices, setDevices] = useState<AndroidDevice[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  useEffect(() => {
    void listPublicTesterDirectory().then(({ data }) => {
      const unique = new Map<string, AndroidDevice>();
      data.flatMap((profile) => profile.devices).forEach((device) => {
        const key = `${device.model}-${device.androidVersion}`;
        if (!unique.has(key)) unique.set(key, { id: key, name: device.model, brand: device.model.split(' ')[0] || 'Android', osVersion: device.androidVersion, screenSize: 'Registered physical device', status: 'Available' });
      });
      setDevices([...unique.values()]);
    }).catch(() => setDevices([]));
  }, []);

  const filteredDevices = devices.filter((dev) => {
    const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dev.osVersion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = brandFilter === 'all' || dev.brand.toLowerCase() === brandFilter.toLowerCase();
    return matchesSearch && matchesBrand;
  });

  const getStatusBadge = (status: AndroidDevice['status']) => {
    switch (status) {
      case 'Available':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
            Available
          </span>
        );
      case 'Active Test':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin text-indigo-400" />
            Active Test
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            In Lab Maintenance
          </span>
        );
    }
  };

  const brands = ['all', 'Samsung', 'Google', 'OnePlus', 'Sony', 'Motorola'];

  return (
    <div className={`max-w-7xl mx-auto px-6 py-28 relative z-10 font-sans transition-colors duration-300 ${
      isDarkMode ? 'text-slate-300' : 'text-slate-800'
    }`}>
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] tracking-widest font-bold mb-6 uppercase ${
          isDarkMode 
            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' 
            : 'border-indigo-100 bg-indigo-50 text-indigo-600'
        }`}>
          Dynamic Hardware Matrix
        </div>
        <BlurText
          text="PHYSICAL DEVICE REGISTRY"
          delay={80}
          animateBy="letters"
          direction="top"
          className={`text-4xl md:text-5xl font-extrabold mb-6 tracking-tight justify-center ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        />
        <p className={`text-base md:text-lg ${
          isDarkMode ? 'text-gray-400' : 'text-slate-500'
        }`}>
          Explore our real-time inventory of 150+ real Android mobile devices. We host standard, foldables, tablets, and legacy flagships to ensure absolute compatibility.
        </p>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className={`border rounded-2xl p-5 text-center transition-all duration-300 ${
          isDarkMode ? 'bg-[#0F0F12]/80 border-white/5' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-gray-500 text-xs block mb-1">Total Online Nodes</span>
          <span className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>150+ Devices</span>
        </div>
        <div className={`border rounded-2xl p-5 text-center transition-all duration-300 ${
          isDarkMode ? 'bg-[#0F0F12]/80 border-white/5' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-gray-500 text-xs block mb-1">OS Coverage Matrix</span>
          <span className={`text-2xl font-extrabold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Android 9 - 15 Beta</span>
        </div>
        <div className={`border rounded-2xl p-5 text-center transition-all duration-300 ${
          isDarkMode ? 'bg-[#0F0F12]/80 border-white/5' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-gray-500 text-xs block mb-1">Global IP Geolocation</span>
          <span className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>45 Countries</span>
        </div>
        <div className={`border rounded-2xl p-5 text-center transition-all duration-300 ${
          isDarkMode ? 'bg-[#0F0F12]/80 border-white/5' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-gray-500 text-xs block mb-1">Lab Sync Frequency</span>
          <span className={`text-2xl font-extrabold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Live (5s Refresh)</span>
        </div>
      </div>

      {/* Matrix Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search model, brand, or OS build version..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 ${
              isDarkMode 
                ? 'bg-[#0F0F12]/80 border-white/5 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
        </div>

        {/* Brand Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setBrandFilter(brand)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border cursor-pointer ${
                brandFilter === brand
                  ? isDarkMode 
                    ? 'bg-white/10 text-white border-white/10' 
                    : 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                  : isDarkMode
                    ? 'bg-transparent text-gray-500 border-white/5 hover:text-gray-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredDevices.map((device) => (
          <div 
            key={device.id}
            className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
              isDarkMode 
                ? 'bg-[#0F0F12]/60 border-white/5 hover:bg-[#0f0f12]/90 hover:border-indigo-500/20' 
                : 'bg-white border-slate-200 hover:shadow-lg hover:shadow-slate-100 hover:border-indigo-200'
            }`}
            data-purpose="device-card"
          >
            <div>
              {/* Brand and Status row */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] uppercase font-mono tracking-widest font-extrabold ${
                  isDarkMode ? 'text-gray-500' : 'text-slate-400'
                }`}>
                  {device.brand}
                </span>
                {getStatusBadge(device.status)}
              </div>

              {/* Name Casing */}
              <h3 className={`font-bold text-base mb-3 flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <Smartphone className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                {device.name}
              </h3>

              {/* Specs Stack */}
              <div className={`space-y-2 text-xs border-t pt-3 mb-4 ${
                isDarkMode ? 'border-white/5' : 'border-slate-200'
              }`}>
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Firmware Build:</span>
                  <span className={`font-medium truncate max-w-[120px] ${
                    isDarkMode ? 'text-gray-300' : 'text-slate-700'
                  }`} title={device.osVersion}>
                    {device.osVersion}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Screen Resolution:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>{device.screenSize}</span>
                </div>
              </div>
            </div>

            <div className={`pt-2 border-t text-[10px] flex items-center justify-between ${
              isDarkMode ? 'border-white/5 text-gray-500' : 'border-slate-200 text-slate-400'
            }`}>
              <span className="flex items-center gap-1">
                <Cpu className={`w-3 h-3 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /> ARMv8-A Node
              </span>
              <span>ID: {device.id}</span>
            </div>
          </div>
        ))}

        {filteredDevices.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-bounce" />
            <p className={`font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>Device offline or occupied</p>
            <p className="text-sm text-gray-500 mt-1">Try resetting the manufacturer filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
