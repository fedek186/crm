type User = {
    id: number;
    name: string;
    surname: string;
    email: string;
    number:number
    weekTrans:number;
    monthTrans:number;
    dailyTrans:number;
    mp: boolean;
    createdAt:Date;
   lastContact:Date; 
}

export const users: User[] = [{
    id: 1,
    name: "Federico",
    surname: "Gomez",
    email: "[EMAIL_ADDRESS]",
    number:123456789,
    weekTrans:10,
    monthTrans:20,
    dailyTrans:5,
    mp: true,
    createdAt:new Date(),
    lastContact:new Date()
},
{
    id: 2,
    name: "Maria",
    surname: "Gonzales",
    email: "[EMAIL_ADDRESS]",
    number:123456789,
    weekTrans:10,
    monthTrans:20,
    dailyTrans:5,
    mp: true,
    createdAt:new Date(),
    lastContact:new Date()
}]
