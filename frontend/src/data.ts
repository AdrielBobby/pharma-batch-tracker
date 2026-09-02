export type Batch = { id:number; medicine:string; batch:string; supplier:string; expiry:string; available:number; received:number; price:number };
export type Medicine = { id:number; name:string; category:string; unit:string; manufacturer:string; stock:number };

const day = (offset:number) => { const d=new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10); };

export const medicines: Medicine[] = [
  {id:1,name:'Paracetamol 500mg',category:'Analgesic',unit:'strip',manufacturer:'Cipla',stock:570},
  {id:2,name:'Amoxicillin 250mg',category:'Antibiotic',unit:'strip',manufacturer:'Sun Pharma',stock:40},
  {id:3,name:'Cetirizine 10mg',category:'Antihistamine',unit:'strip',manufacturer:"Dr. Reddy's",stock:240},
  {id:4,name:'Insulin Glargine',category:'Hormone',unit:'vial',manufacturer:'Biocon',stock:60},
];

export const batches: Batch[] = [
  {id:2,medicine:'Paracetamol 500mg',batch:'PCM-2024-A2',supplier:'MedLine Distributors',expiry:day(10),available:90,received:300,price:1.15},
  {id:3,medicine:'Amoxicillin 250mg',batch:'AMX-2023-B1',supplier:'HealthCore Pharma',expiry:day(-15),available:40,received:200,price:2.50},
  {id:5,medicine:'Insulin Glargine',batch:'INS-2024-D1',supplier:'HealthCore Pharma',expiry:day(25),available:60,received:60,price:350},
  {id:4,medicine:'Cetirizine 10mg',batch:'CTZ-2024-C1',supplier:'Sunrise Wholesale',expiry:day(200),available:240,received:250,price:1.80},
  {id:1,medicine:'Paracetamol 500mg',batch:'PCM-2024-A1',supplier:'MedLine Distributors',expiry:day(400),available:480,received:500,price:1.20},
];

export const suppliers = [
  {id:1,name:'MedLine Distributors',contact:'Anita Rao',phone:'9876543210',email:'anita@medline.example',batches:2},
  {id:2,name:'HealthCore Pharma',contact:'Vikram Shah',phone:'9123456780',email:'vikram@healthcore.example',batches:2},
  {id:3,name:'Sunrise Wholesale',contact:'Priya Nair',phone:'9988776655',email:'priya@sunrise.example',batches:1},
];

export const sales = [
  {id:'S-103',medicine:'Cetirizine 10mg',batch:'CTZ-2024-C1',customer:'Walk-in',qty:10,total:30,date:'Today, 11:24 AM'},
  {id:'S-102',medicine:'Paracetamol 500mg',batch:'PCM-2024-A2',customer:'City Clinic',qty:30,total:60,date:'Today, 10:12 AM'},
  {id:'S-101',medicine:'Paracetamol 500mg',batch:'PCM-2024-A1',customer:'Walk-in',qty:20,total:40,date:'Today, 9:40 AM'},
];

export const daysLeft = (date:string) => Math.ceil((new Date(date).getTime()-new Date(new Date().toDateString()).getTime())/86400000);
