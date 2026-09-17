import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(_request: NextRequest,{params}:{params:Promise<{invoiceId:string}>}){const {invoiceId}=await params;const i=await prisma.invoice.findUnique({where:{id:invoiceId},include:{customer:{select:{customerName:true}}}});if(!i)return NextResponse.json({error:'Invoice not found'},{status:404});return NextResponse.json({data:{invoiceNumber:i.invoiceNumber,customerName:i.customer.customerName,dueAmount:Number(i.dueAmount),dueDate:i.dueDate,status:i.status}})}
