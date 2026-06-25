'use client'
// @ts-nocheck
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Car database — make → models → years → specs
const CAR_DB = {
  'Honda': {
    'Civic':     { '2020':{ mpg:32, tank:12.4, grade:'Regular' }, '2021':{ mpg:32, tank:12.4, grade:'Regular' }, '2022':{ mpg:33, tank:12.4, grade:'Regular' }, '2023':{ mpg:33, tank:12.4, grade:'Regular' }, '2024':{ mpg:36, tank:12.4, grade:'Regular' } },
    'Accord':    { '2020':{ mpg:30, tank:14.8, grade:'Regular' }, '2021':{ mpg:30, tank:14.8, grade:'Regular' }, '2022':{ mpg:29, tank:14.8, grade:'Regular' }, '2023':{ mpg:29, tank:14.8, grade:'Regular' }, '2024':{ mpg:29, tank:14.8, grade:'Regular' } },
    'CR-V':      { '2020':{ mpg:28, tank:14.0, grade:'Regular' }, '2021':{ mpg:28, tank:14.0, grade:'Regular' }, '2022':{ mpg:28, tank:14.0, grade:'Regular' }, '2023':{ mpg:29, tank:14.0, grade:'Regular' }, '2024':{ mpg:29, tank:14.0, grade:'Regular' } },
    'Pilot':     { '2020':{ mpg:20, tank:19.5, grade:'Regular' }, '2021':{ mpg:20, tank:19.5, grade:'Regular' }, '2022':{ mpg:20, tank:19.5, grade:'Regular' }, '2023':{ mpg:22, tank:19.5, grade:'Regular' }, '2024':{ mpg:22, tank:19.5, grade:'Regular' } },
    'Odyssey':   { '2020':{ mpg:22, tank:19.5, grade:'Regular' }, '2021':{ mpg:22, tank:19.5, grade:'Regular' }, '2022':{ mpg:22, tank:19.5, grade:'Regular' }, '2023':{ mpg:22, tank:19.5, grade:'Regular' }, '2024':{ mpg:22, tank:19.5, grade:'Regular' } },
  },
  'Toyota': {
    'Camry':     { '2020':{ mpg:29, tank:15.8, grade:'Regular' }, '2021':{ mpg:29, tank:15.8, grade:'Regular' }, '2022':{ mpg:28, tank:15.8, grade:'Regular' }, '2023':{ mpg:28, tank:15.8, grade:'Regular' }, '2024':{ mpg:28, tank:15.8, grade:'Regular' } },
    'Corolla':   { '2020':{ mpg:32, tank:13.2, grade:'Regular' }, '2021':{ mpg:32, tank:13.2, grade:'Regular' }, '2022':{ mpg:31, tank:13.2, grade:'Regular' }, '2023':{ mpg:31, tank:13.2, grade:'Regular' }, '2024':{ mpg:32, tank:13.2, grade:'Regular' } },
    'RAV4':      { '2020':{ mpg:30, tank:14.5, grade:'Regular' }, '2021':{ mpg:30, tank:14.5, grade:'Regular' }, '2022':{ mpg:30, tank:14.5, grade:'Regular' }, '2023':{ mpg:30, tank:14.5, grade:'Regular' }, '2024':{ mpg:30, tank:14.5, grade:'Regular' } },
    'Highlander':{ '2020':{ mpg:21, tank:17.9, grade:'Regular' }, '2021':{ mpg:21, tank:17.9, grade:'Regular' }, '2022':{ mpg:22, tank:17.9, grade:'Regular' }, '2023':{ mpg:22, tank:17.9, grade:'Regular' }, '2024':{ mpg:23, tank:17.9, grade:'Regular' } },
    'Tacoma':    { '2020':{ mpg:20, tank:21.1, grade:'Regular' }, '2021':{ mpg:20, tank:21.1, grade:'Regular' }, '2022':{ mpg:20, tank:21.1, grade:'Regular' }, '2023':{ mpg:20, tank:21.1, grade:'Regular' }, '2024':{ mpg:23, tank:21.1, grade:'Regular' } },
    'Tundra':    { '2020':{ mpg:15, tank:22.5, grade:'Regular' }, '2021':{ mpg:15, tank:22.5, grade:'Regular' }, '2022':{ mpg:18, tank:22.5, grade:'Regular' }, '2023':{ mpg:18, tank:22.5, grade:'Regular' }, '2024':{ mpg:18, tank:22.5, grade:'Regular' } },
    'Prius':     { '2020':{ mpg:52, tank:11.3, grade:'Regular' }, '2021':{ mpg:52, tank:11.3, grade:'Regular' }, '2022':{ mpg:52, tank:11.3, grade:'Regular' }, '2023':{ mpg:57, tank:11.3, grade:'Regular' }, '2024':{ mpg:57, tank:11.3, grade:'Regular' } },
  },
  'Ford': {
    'F-150':         { '2020':{ mpg:22, tank:23.0, grade:'Regular' }, '2021':{ mpg:22, tank:23.0, grade:'Regular' }, '2022':{ mpg:23, tank:23.0, grade:'Regular' }, '2023':{ mpg:23, tank:23.0, grade:'Regular' }, '2024':{ mpg:24, tank:23.0, grade:'Regular' } },
    'Mustang':       { '2020':{ mpg:21, tank:16.0, grade:'Premium' }, '2021':{ mpg:21, tank:16.0, grade:'Premium' }, '2022':{ mpg:21, tank:16.0, grade:'Premium' }, '2023':{ mpg:21, tank:16.0, grade:'Premium' }, '2024':{ mpg:22, tank:16.0, grade:'Premium' } },
    'Explorer':      { '2020':{ mpg:23, tank:18.0, grade:'Regular' }, '2021':{ mpg:23, tank:18.0, grade:'Regular' }, '2022':{ mpg:23, tank:18.0, grade:'Regular' }, '2023':{ mpg:24, tank:18.0, grade:'Regular' }, '2024':{ mpg:24, tank:18.0, grade:'Regular' } },
    'Escape':        { '2020':{ mpg:28, tank:14.8, grade:'Regular' }, '2021':{ mpg:28, tank:14.8, grade:'Regular' }, '2022':{ mpg:28, tank:14.8, grade:'Regular' }, '2023':{ mpg:28, tank:14.8, grade:'Regular' }, '2024':{ mpg:28, tank:14.8, grade:'Regular' } },
    'Bronco':        { '2021':{ mpg:20, tank:16.9, grade:'Regular' }, '2022':{ mpg:20, tank:16.9, grade:'Regular' }, '2023':{ mpg:20, tank:16.9, grade:'Regular' }, '2024':{ mpg:20, tank:16.9, grade:'Regular' } },
    'Maverick':      { '2022':{ mpg:37, tank:15.5, grade:'Regular' }, '2023':{ mpg:37, tank:15.5, grade:'Regular' }, '2024':{ mpg:37, tank:15.5, grade:'Regular' } },
  },
  'Chevrolet': {
    'Silverado':     { '2020':{ mpg:20, tank:24.0, grade:'Regular' }, '2021':{ mpg:20, tank:24.0, grade:'Regular' }, '2022':{ mpg:20, tank:24.0, grade:'Regular' }, '2023':{ mpg:20, tank:24.0, grade:'Regular' }, '2024':{ mpg:21, tank:24.0, grade:'Regular' } },
    'Equinox':       { '2020':{ mpg:28, tank:14.9, grade:'Regular' }, '2021':{ mpg:28, tank:14.9, grade:'Regular' }, '2022':{ mpg:28, tank:14.9, grade:'Regular' }, '2023':{ mpg:28, tank:14.9, grade:'Regular' }, '2024':{ mpg:28, tank:14.9, grade:'Regular' } },
    'Malibu':        { '2020':{ mpg:29, tank:15.8, grade:'Regular' }, '2021':{ mpg:29, tank:15.8, grade:'Regular' }, '2022':{ mpg:29, tank:15.8, grade:'Regular' }, '2023':{ mpg:29, tank:15.8, grade:'Regular' } },
    'Traverse':      { '2020':{ mpg:22, tank:19.4, grade:'Regular' }, '2021':{ mpg:22, tank:19.4, grade:'Regular' }, '2022':{ mpg:22, tank:19.4, grade:'Regular' }, '2023':{ mpg:22, tank:19.4, grade:'Regular' }, '2024':{ mpg:24, tank:19.4, grade:'Regular' } },
    'Colorado':      { '2020':{ mpg:20, tank:21.0, grade:'Regular' }, '2021':{ mpg:20, tank:21.0, grade:'Regular' }, '2022':{ mpg:20, tank:21.0, grade:'Regular' }, '2023':{ mpg:20, tank:21.0, grade:'Regular' }, '2024':{ mpg:22, tank:21.0, grade:'Regular' } },
  },
  'BMW': {
    '3 Series':  { '2020':{ mpg:30, tank:15.6, grade:'Premium' }, '2021':{ mpg:30, tank:15.6, grade:'Premium' }, '2022':{ mpg:29, tank:15.6, grade:'Premium' }, '2023':{ mpg:29, tank:15.6, grade:'Premium' }, '2024':{ mpg:29, tank:15.6, grade:'Premium' } },
    '5 Series':  { '2020':{ mpg:26, tank:15.6, grade:'Premium' }, '2021':{ mpg:26, tank:15.6, grade:'Premium' }, '2022':{ mpg:26, tank:15.6, grade:'Premium' }, '2023':{ mpg:26, tank:15.6, grade:'Premium' }, '2024':{ mpg:28, tank:15.6, grade:'Premium' } },
    'X3':        { '2020':{ mpg:25, tank:17.2, grade:'Premium' }, '2021':{ mpg:25, tank:17.2, grade:'Premium' }, '2022':{ mpg:25, tank:17.2, grade:'Premium' }, '2023':{ mpg:26, tank:17.2, grade:'Premium' }, '2024':{ mpg:26, tank:17.2, grade:'Premium' } },
    'X5':        { '2020':{ mpg:21, tank:21.9, grade:'Premium' }, '2021':{ mpg:21, tank:21.9, grade:'Premium' }, '2022':{ mpg:21, tank:21.9, grade:'Premium' }, '2023':{ mpg:22, tank:21.9, grade:'Premium' }, '2024':{ mpg:23, tank:21.9, grade:'Premium' } },
  },
  'Mercedes-Benz': {
    'C-Class':   { '2020':{ mpg:25, tank:15.6, grade:'Premium' }, '2021':{ mpg:25, tank:15.6, grade:'Premium' }, '2022':{ mpg:25, tank:15.6, grade:'Premium' }, '2023':{ mpg:26, tank:15.6, grade:'Premium' }, '2024':{ mpg:26, tank:15.6, grade:'Premium' } },
    'E-Class':   { '2020':{ mpg:24, tank:17.4, grade:'Premium' }, '2021':{ mpg:24, tank:17.4, grade:'Premium' }, '2022':{ mpg:24, tank:17.4, grade:'Premium' }, '2023':{ mpg:25, tank:17.4, grade:'Premium' }, '2024':{ mpg:26, tank:17.4, grade:'Premium' } },
    'GLE':       { '2020':{ mpg:20, tank:21.2, grade:'Premium' }, '2021':{ mpg:20, tank:21.2, grade:'Premium' }, '2022':{ mpg:21, tank:21.2, grade:'Premium' }, '2023':{ mpg:21, tank:21.2, grade:'Premium' }, '2024':{ mpg:22, tank:21.2, grade:'Premium' } },
  },
  'Jeep': {
    'Wrangler':  { '2020':{ mpg:20, tank:18.5, grade:'Regular' }, '2021':{ mpg:20, tank:18.5, grade:'Regular' }, '2022':{ mpg:20, tank:18.5, grade:'Regular' }, '2023':{ mpg:20, tank:18.5, grade:'Regular' }, '2024':{ mpg:20, tank:18.5, grade:'Regular' } },
    'Grand Cherokee':{ '2020':{ mpg:19, tank:24.6, grade:'Regular' }, '2021':{ mpg:19, tank:24.6, grade:'Regular' }, '2022':{ mpg:22, tank:17.2, grade:'Regular' }, '2023':{ mpg:22, tank:17.2, grade:'Regular' }, '2024':{ mpg:23, tank:17.2, grade:'Regular' } },
    'Compass':   { '2020':{ mpg:26, tank:13.5, grade:'Regular' }, '2021':{ mpg:26, tank:13.5, grade:'Regular' }, '2022':{ mpg:26, tank:13.5, grade:'Regular' }, '2023':{ mpg:26, tank:13.5, grade:'Regular' }, '2024':{ mpg:26, tank:13.5, grade:'Regular' } },
  },
  'Tesla': {
    'Model 3':   { '2020':{ mpg:141, tank:0, grade:'Electric' }, '2021':{ mpg:141, tank:0, grade:'Electric' }, '2022':{ mpg:138, tank:0, grade:'Electric' }, '2023':{ mpg:138, tank:0, grade:'Electric' }, '2024':{ mpg:138, tank:0, grade:'Electric' } },
    'Model Y':   { '2020':{ mpg:125, tank:0, grade:'Electric' }, '2021':{ mpg:125, tank:0, grade:'Electric' }, '2022':{ mpg:123, tank:0, grade:'Electric' }, '2023':{ mpg:126, tank:0, grade:'Electric' }, '2024':{ mpg:126, tank:0, grade:'Electric' } },
    'Model S':   { '2020':{ mpg:111, tank:0, grade:'Electric' }, '2021':{ mpg:120, tank:0, grade:'Electric' }, '2022':{ mpg:120, tank:0, grade:'Electric' }, '2023':{ mpg:120, tank:0, grade:'Electric' }, '2024':{ mpg:120, tank:0, grade:'Electric' } },
    'Model X':   { '2020':{ mpg:93,  tank:0, grade:'Electric' }, '2021':{ mpg:93,  tank:0, grade:'Electric' }, '2022':{ mpg:102, tank:0, grade:'Electric' }, '2023':{ mpg:102, tank:0, grade:'Electric' }, '2024':{ mpg:102, tank:0, grade:'Electric' } },
  },
  'Dodge': {
    'Charger':   { '2020':{ mpg:21, tank:18.5, grade:'Premium' }, '2021':{ mpg:21, tank:18.5, grade:'Premium' }, '2022':{ mpg:21, tank:18.5, grade:'Premium' }, '2023':{ mpg:21, tank:18.5, grade:'Premium' } },
    'Challenger':{ '2020':{ mpg:21, tank:16.0, grade:'Premium' }, '2021':{ mpg:21, tank:16.0, grade:'Premium' }, '2022':{ mpg:21, tank:16.0, grade:'Premium' }, '2023':{ mpg:21, tank:16.0, grade:'Premium' } },
    'Durango':   { '2020':{ mpg:19, tank:24.6, grade:'Regular' }, '2021':{ mpg:19, tank:24.6, grade:'Regular' }, '2022':{ mpg:19, tank:24.6, grade:'Regular' }, '2023':{ mpg:19, tank:24.6, grade:'Regular' } },
  },
  'Hyundai': {
    'Sonata':    { '2020':{ mpg:32, tank:15.9, grade:'Regular' }, '2021':{ mpg:32, tank:15.9, grade:'Regular' }, '2022':{ mpg:32, tank:15.9, grade:'Regular' }, '2023':{ mpg:32, tank:15.9, grade:'Regular' }, '2024':{ mpg:32, tank:15.9, grade:'Regular' } },
    'Elantra':   { '2020':{ mpg:33, tank:14.0, grade:'Regular' }, '2021':{ mpg:37, tank:12.4, grade:'Regular' }, '2022':{ mpg:37, tank:12.4, grade:'Regular' }, '2023':{ mpg:37, tank:12.4, grade:'Regular' }, '2024':{ mpg:37, tank:12.4, grade:'Regular' } },
    'Tucson':    { '2020':{ mpg:26, tank:16.4, grade:'Regular' }, '2021':{ mpg:26, tank:16.4, grade:'Regular' }, '2022':{ mpg:28, tank:14.8, grade:'Regular' }, '2023':{ mpg:29, tank:14.8, grade:'Regular' }, '2024':{ mpg:29, tank:14.8, grade:'Regular' } },
    'Santa Fe':  { '2020':{ mpg:25, tank:17.7, grade:'Regular' }, '2021':{ mpg:25, tank:17.7, grade:'Regular' }, '2022':{ mpg:25, tank:17.7, grade:'Regular' }, '2023':{ mpg:25, tank:17.7, grade:'Regular' }, '2024':{ mpg:26, tank:17.7, grade:'Regular' } },
  },
  'Kia': {
    'Soul':      { '2020':{ mpg:29, tank:13.2, grade:'Regular' }, '2021':{ mpg:29, tank:13.2, grade:'Regular' }, '2022':{ mpg:29, tank:13.2, grade:'Regular' }, '2023':{ mpg:29, tank:13.2, grade:'Regular' }, '2024':{ mpg:29, tank:13.2, grade:'Regular' } },
    'Sportage':  { '2020':{ mpg:26, tank:16.4, grade:'Regular' }, '2021':{ mpg:26, tank:16.4, grade:'Regular' }, '2022':{ mpg:29, tank:14.3, grade:'Regular' }, '2023':{ mpg:29, tank:14.3, grade:'Regular' }, '2024':{ mpg:29, tank:14.3, grade:'Regular' } },
    'Forte':     { '2020':{ mpg:32, tank:13.2, grade:'Regular' }, '2021':{ mpg:32, tank:13.2, grade:'Regular' }, '2022':{ mpg:33, tank:13.2, grade:'Regular' }, '2023':{ mpg:33, tank:13.2, grade:'Regular' }, '2024':{ mpg:33, tank:13.2, grade:'Regular' } },
    'Telluride': { '2020':{ mpg:21, tank:18.8, grade:'Regular' }, '2021':{ mpg:21, tank:18.8, grade:'Regular' }, '2022':{ mpg:21, tank:18.8, grade:'Regular' }, '2023':{ mpg:21, tank:18.8, grade:'Regular' }, '2024':{ mpg:21, tank:18.8, grade:'Regular' } },
  },
  'Nissan': {
    'Altima':    { '2020':{ mpg:32, tank:16.2, grade:'Regular' }, '2021':{ mpg:32, tank:16.2, grade:'Regular' }, '2022':{ mpg:32, tank:16.2, grade:'Regular' }, '2023':{ mpg:32, tank:16.2, grade:'Regular' }, '2024':{ mpg:32, tank:16.2, grade:'Regular' } },
    'Sentra':    { '2020':{ mpg:29, tank:12.4, grade:'Regular' }, '2021':{ mpg:33, tank:12.4, grade:'Regular' }, '2022':{ mpg:33, tank:12.4, grade:'Regular' }, '2023':{ mpg:33, tank:12.4, grade:'Regular' }, '2024':{ mpg:33, tank:12.4, grade:'Regular' } },
    'Rogue':     { '2020':{ mpg:30, tank:14.5, grade:'Regular' }, '2021':{ mpg:33, tank:14.5, grade:'Regular' }, '2022':{ mpg:33, tank:14.5, grade:'Regular' }, '2023':{ mpg:33, tank:14.5, grade:'Regular' }, '2024':{ mpg:33, tank:14.5, grade:'Regular' } },
    'Frontier':  { '2020':{ mpg:18, tank:21.0, grade:'Regular' }, '2021':{ mpg:18, tank:21.0, grade:'Regular' }, '2022':{ mpg:21, tank:21.0, grade:'Regular' }, '2023':{ mpg:21, tank:21.0, grade:'Regular' }, '2024':{ mpg:21, tank:21.0, grade:'Regular' } },
  },
  'Ram': {
    '1500':      { '2020':{ mpg:20, tank:23.0, grade:'Regular' }, '2021':{ mpg:20, tank:23.0, grade:'Regular' }, '2022':{ mpg:20, tank:23.0, grade:'Regular' }, '2023':{ mpg:21, tank:23.0, grade:'Regular' }, '2024':{ mpg:21, tank:23.0, grade:'Regular' } },
    'ProMaster': { '2020':{ mpg:16, tank:24.6, grade:'Regular' }, '2021':{ mpg:16, tank:24.6, grade:'Regular' }, '2022':{ mpg:16, tank:24.6, grade:'Regular' }, '2023':{ mpg:16, tank:24.6, grade:'Regular' }, '2024':{ mpg:16, tank:24.6, grade:'Regular' } },
  },
  'GMC': {
    'Sierra':    { '2020':{ mpg:20, tank:24.0, grade:'Regular' }, '2021':{ mpg:20, tank:24.0, grade:'Regular' }, '2022':{ mpg:20, tank:24.0, grade:'Regular' }, '2023':{ mpg:20, tank:24.0, grade:'Regular' }, '2024':{ mpg:21, tank:24.0, grade:'Regular' } },
    'Terrain':   { '2020':{ mpg:26, tank:14.9, grade:'Regular' }, '2021':{ mpg:26, tank:14.9, grade:'Regular' }, '2022':{ mpg:26, tank:14.9, grade:'Regular' }, '2023':{ mpg:26, tank:14.9, grade:'Regular' }, '2024':{ mpg:28, tank:14.9, grade:'Regular' } },
    'Yukon':     { '2020':{ mpg:15, tank:28.0, grade:'Regular' }, '2021':{ mpg:15, tank:28.0, grade:'Regular' }, '2022':{ mpg:15, tank:28.0, grade:'Regular' }, '2023':{ mpg:16, tank:28.0, grade:'Regular' }, '2024':{ mpg:16, tank:28.0, grade:'Regular' } },
  },
  'Subaru': {
    'Outback':   { '2020':{ mpg:30, tank:18.5, grade:'Regular' }, '2021':{ mpg:30, tank:18.5, grade:'Regular' }, '2022':{ mpg:30, tank:18.5, grade:'Regular' }, '2023':{ mpg:30, tank:18.5, grade:'Regular' }, '2024':{ mpg:30, tank:18.5, grade:'Regular' } },
    'Forester':  { '2020':{ mpg:28, tank:16.6, grade:'Regular' }, '2021':{ mpg:28, tank:16.6, grade:'Regular' }, '2022':{ mpg:28, tank:16.6, grade:'Regular' }, '2023':{ mpg:28, tank:16.6, grade:'Regular' }, '2024':{ mpg:29, tank:16.6, grade:'Regular' } },
    'Crosstrek': { '2020':{ mpg:29, tank:13.2, grade:'Regular' }, '2021':{ mpg:29, tank:13.2, grade:'Regular' }, '2022':{ mpg:29, tank:13.2, grade:'Regular' }, '2023':{ mpg:32, tank:13.2, grade:'Regular' }, '2024':{ mpg:33, tank:13.2, grade:'Regular' } },
    'Impreza':   { '2020':{ mpg:31, tank:13.2, grade:'Regular' }, '2021':{ mpg:31, tank:13.2, grade:'Regular' }, '2022':{ mpg:28, tank:13.2, grade:'Regular' }, '2023':{ mpg:28, tank:13.2, grade:'Regular' }, '2024':{ mpg:28, tank:13.2, grade:'Regular' } },
  },
  'Volkswagen': {
    'Jetta':     { '2020':{ mpg:35, tank:13.2, grade:'Regular' }, '2021':{ mpg:35, tank:13.2, grade:'Regular' }, '2022':{ mpg:35, tank:13.2, grade:'Regular' }, '2023':{ mpg:35, tank:13.2, grade:'Regular' }, '2024':{ mpg:35, tank:13.2, grade:'Regular' } },
    'Tiguan':    { '2020':{ mpg:24, tank:15.9, grade:'Regular' }, '2021':{ mpg:24, tank:15.9, grade:'Regular' }, '2022':{ mpg:24, tank:15.9, grade:'Regular' }, '2023':{ mpg:24, tank:15.9, grade:'Regular' }, '2024':{ mpg:25, tank:15.9, grade:'Regular' } },
    'Atlas':     { '2020':{ mpg:20, tank:18.6, grade:'Regular' }, '2021':{ mpg:20, tank:18.6, grade:'Regular' }, '2022':{ mpg:20, tank:18.6, grade:'Regular' }, '2023':{ mpg:21, tank:18.6, grade:'Regular' }, '2024':{ mpg:21, tank:18.6, grade:'Regular' } },
  },
}

const GRADE_COLOR = { Regular:'#ff3b30', 'Mid-grade':'#ff9f0a', Premium:'#0a84ff', Electric:'#30d158' }
const YEARS = ['2024','2023','2022','2021','2020','2019','2018']


export default function VehiclePage() {
  const router = useRouter()
  const [make,      setMake]      = useState('')
  const [model,     setModel]     = useState('')
  const [year,      setYear]      = useState('')
  const [fillAlert, setFillAlert] = useState('half')
  const [stopPref,  setStopPref]  = useState('any')
  const [saved,     setSaved]     = useState(false)
  const [saving,    setSaving]    = useState(false)

  // Load saved vehicle from Supabase
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles')
        .select('vehicle_make,vehicle_model,vehicle_year,fill_alert,stop_pref')
        .eq('id', user.id).single()
      if (!p) return
      if (p.vehicle_make)  setMake(p.vehicle_make)
      if (p.vehicle_model) setModel(p.vehicle_model)
      if (p.vehicle_year)  setYear(p.vehicle_year)
      if (p.fill_alert)    setFillAlert(p.fill_alert)
      if (p.stop_pref)     setStopPref(p.stop_pref)
    }
    load()
  }, [])

  const makes  = Object.keys(CAR_DB).sort()
  const models = make ? Object.keys(CAR_DB[make]).sort() : []
  const years  = (make && model) ? Object.keys(CAR_DB[make][model]).sort().reverse() : []
  const specs  = (make && model && year && CAR_DB[make]?.[model]?.[year]) ? CAR_DB[make][model][year] : null

  const mpg  = specs?.mpg  ?? 28
  const tank = specs?.tank ?? 14

  const handleSave = async () => {
    if (!specs) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({
          vehicle_make:     make,
          vehicle_model:    model,
          vehicle_year:     year,
          grade_preference: specs.grade,
          tank_size:        Math.round(specs.tank),
          miles_per_week:   Math.round(specs.mpg * 40),
          fill_alert:       fillAlert,
          stop_pref:        stopPref,
        }).eq('id', user.id)
      }
    } catch(e) {}
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const FILL_OPTS = [
    { id:'quarter', label:'1/4 tank', sub:'~30 miles warning' },
    { id:'half',    label:'1/2 tank', sub:'~60 miles warning' },
    { id:'three',   label:'3/4 tank', sub:'~90 miles warning' },
    { id:'every',   label:'Every stop', sub:'always suggest gas' },
    { id:'never',   label:'Never', sub:'no reminders' },
  ]
  const STOP_OPTS = [
    { id:'any',     label:'Any station',    sub:'show all options' },
    { id:'travel',  label:'Travel centers', sub:"Love's, Pilot, Buc-ee's, Flying J" },
    { id:'bigname', label:'Big name only',  sub:'Shell, BP, Chevron, QuikTrip' },
    { id:'clean',   label:'Cleanest rated', sub:'4.0+ cleanliness score' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0eff4;background-image:radial-gradient(ellipse 70% 50% at 15% 5%,rgba(255,59,48,0.09) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(10,132,255,0.07) 0%,transparent 50%);font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;min-height:100vh;-webkit-font-smoothing:antialiased;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes navSlide{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .gc-nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:1100px;z-index:998;display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:58px;background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);animation:navSlide .5s cubic-bezier(.34,1.56,.64,1) both}
        .gc-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(40px);border:0.5px solid rgba(255,255,255,0.92);border-radius:28px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:12px}
        .gc-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(26,26,46,.4);margin-bottom:12px}
        .car-chip{padding:8px 16px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;border:0.5px solid;transition:all .2s;font-family:'DM Sans',sans-serif}
        .opt-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:0.5px solid rgba(0,0,0,0.05);cursor:pointer;transition:background .15s}
        .opt-row:last-child{border-bottom:none}
        .radio{width:20px;height:20px;border-radius:50%;border:2px solid rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
        .radio.on{background:#ff3b30;border-color:#ff3b30}
        .radio-dot{width:7px;height:7px;border-radius:50%;background:#fff}
        .gc-range{width:100%;accent-color:#ff3b30;margin:10px 0 4px}
        .big-btn{width:100%;padding:15px;border-radius:20px;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
      `}</style>

      <nav className="gc-nav">
        <Link href="/dashboard/gas" style={{display:'flex',alignItems:'center',gap:6,color:'#0a84ff',fontSize:14,fontWeight:500,textDecoration:'none'}}>
          <span style={{fontSize:18}}>‹</span> Gas Tracker
        </Link>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:800,letterSpacing:-.5,color:'#1a1a2e'}}>My Vehicle</div>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:2,color:'rgba(26,26,46,.4)',textTransform:'uppercase'}}>saved to your profile</div>
        </div>
        <div style={{width:60}}/>
      </nav>

      <div style={{maxWidth:700,margin:'0 auto',padding:'88px 20px 100px',animation:'fadeUp .5s ease both'}}>

        {/* Car selector — Make → Model → Year */}
        <div className="gc-card">
          <div className="gc-label">Your vehicle</div>

          {/* Step 1 — Make */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>Make</div>
            <select value={make} onChange={e=>{setMake(e.target.value);setModel('');setYear('')}}
              style={{width:'100%',background:'rgba(255,255,255,0.6)',border:'0.5px solid rgba(255,255,255,0.9)',borderRadius:14,padding:'11px 14px',fontSize:14,color:make?'#1a1a2e':'rgba(26,26,46,.4)',outline:'none',fontFamily:"'DM Sans',sans-serif",backdropFilter:'blur(20px)'}}>
              <option value="">Select make...</option>
              {makes.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Step 2 — Model */}
          <div style={{marginBottom:14,opacity:make?1:0.4,pointerEvents:make?'auto':'none'}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>Model</div>
            <select value={model} onChange={e=>{setModel(e.target.value);setYear('')}}
              style={{width:'100%',background:'rgba(255,255,255,0.6)',border:'0.5px solid rgba(255,255,255,0.9)',borderRadius:14,padding:'11px 14px',fontSize:14,color:model?'#1a1a2e':'rgba(26,26,46,.4)',outline:'none',fontFamily:"'DM Sans',sans-serif",backdropFilter:'blur(20px)'}}>
              <option value="">Select model...</option>
              {models.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Step 3 — Year */}
          <div style={{marginBottom:18,opacity:model?1:0.4,pointerEvents:model?'auto':'none'}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(26,26,46,.5)',marginBottom:6}}>Year</div>
            <select value={year} onChange={e=>setYear(e.target.value)}
              style={{width:'100%',background:'rgba(255,255,255,0.6)',border:'0.5px solid rgba(255,255,255,0.9)',borderRadius:14,padding:'11px 14px',fontSize:14,color:year?'#1a1a2e':'rgba(26,26,46,.4)',outline:'none',fontFamily:"'DM Sans',sans-serif",backdropFilter:'blur(20px)'}}>
              <option value="">Select year...</option>
              {years.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Auto-detected specs — shows after year selected */}
          {specs ? (
            <div style={{background:`${GRADE_COLOR[specs.grade]}0d`,border:`1px solid ${GRADE_COLOR[specs.grade]}30`,borderRadius:18,padding:'16px 18px',display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:44,height:44,borderRadius:13,background:`${GRADE_COLOR[specs.grade]}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                {specs.grade==='Electric'?'⚡':'⛽'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:GRADE_COLOR[specs.grade],marginBottom:4}}>
                  {year} {make} {model}
                </div>
                <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:2}}>Fuel grade</div>
                    <div style={{fontSize:13,fontWeight:600,color:GRADE_COLOR[specs.grade]}}>{specs.grade}</div>
                  </div>
                  {specs.grade !== 'Electric' && <>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:2}}>City/Hwy MPG</div>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{specs.mpg} mpg</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:2}}>Tank size</div>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{specs.tank} gal</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:2}}>Full tank range</div>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{Math.round(specs.mpg * specs.tank)} mi</div>
                    </div>
                  </>}
                  {specs.grade === 'Electric' && (
                    <div>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'rgba(26,26,46,.4)',textTransform:'uppercase',marginBottom:2}}>Efficiency</div>
                      <div style={{fontSize:13,fontWeight:600,color:GRADE_COLOR['Electric']}}>{specs.mpg} MPGe</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{background:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.8)',borderRadius:16,padding:'16px 18px',textAlign:'center',color:'rgba(26,26,46,.35)',fontSize:13}}>
              Select your make, model, and year to auto-detect fuel grade, MPG, and tank size
            </div>
          )}
        </div>



        {/* Fill-up reminder */}
        <div className="gc-card">
          <div className="gc-label">Remind me to fill up when</div>
          {FILL_OPTS.map(o=>(
            <div key={o.id} className="opt-row" onClick={()=>setFillAlert(o.id)}>
              <div className={`radio ${fillAlert===o.id?'on':''}`}>
                {fillAlert===o.id && <div className="radio-dot"/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{o.label}</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.45)',marginTop:1}}>{o.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stop preference */}
        <div className="gc-card">
          <div className="gc-label">Preferred stop type</div>
          {STOP_OPTS.map(o=>(
            <div key={o.id} className="opt-row" onClick={()=>setStopPref(o.id)}>
              <div className={`radio ${stopPref===o.id?'on':''}`}>
                {stopPref===o.id && <div className="radio-dot"/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:'#1a1a2e'}}>{o.label}</div>
                <div style={{fontSize:11,color:'rgba(26,26,46,.45)',marginTop:1}}>{o.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSave} className="big-btn" style={{
          background: saved ? 'rgba(48,209,88,0.12)' : 'linear-gradient(135deg,#ff3b30,#ff6b35)',
          color: saved ? '#1a7a35' : '#fff',
          border: saved ? '1px solid rgba(48,209,88,0.3)' : 'none',
          boxShadow: saved ? 'none' : '0 4px 20px rgba(255,59,48,0.35)',
        }}>
          {saving ? 'Saving...' : saved ? '✓ Vehicle settings saved' : 'Save vehicle settings'}
        </button>
      </div>
    </>
  )
}