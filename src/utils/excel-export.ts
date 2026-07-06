import * as XLSX from 'xlsx';
import { Candidate } from '@/types/candidate';

export function exportCandidatesToExcel(candidates: Candidate[], dcmType: string) {
  // Map data to the required headers
  const data = candidates.map((c, index) => {
    // Format LinkedIn as plain text or NA
    const linkedinVal = c.linkedin_url || 'NA';
    
    return {
      'SL.No': index + 1,
      'Name': c.candidate_name || 'N/A',
      'Recruitly ID': c.recruitly_id || '', // Left empty/blank by default
      'Location': c.location || 'N/A',
      'Email': c.email || 'N/A',
      'Phone Number': c.phone_number || 'N/A',
      'Current Company': c.current_position || 'N/A',
      'Job Title': c.job_title || 'N/A',
      'T1': c.t1_tenure !== undefined && c.t1_tenure !== null ? c.t1_tenure : 'N/A',
      'T2': c.t2_tenure !== undefined && c.t2_tenure !== null ? c.t2_tenure : 'N/A',
      'Business': c.business_specialization || 'N/A',
      'LinkedIn': linkedinVal,
      'Salary Range': c.salary_range || 'N/A',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths for polished presentation
  worksheet['!cols'] = [
    { wch: 8 },   // SL.No
    { wch: 22 },  // Name
    { wch: 15 },  // Recruitly ID
    { wch: 18 },  // Location
    { wch: 25 },  // Email
    { wch: 18 },  // Phone Number
    { wch: 28 },  // Current Company
    { wch: 25 },  // Job Title
    { wch: 8 },   // T1
    { wch: 8 },   // T2
    { wch: 18 },  // Business
    { wch: 25 },  // LinkedIn
    { wch: 20 },  // Salary Range
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
  
  // Generate filename: Humres DCM - [DCM Type] - DD-MM-YYYY.xlsx
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const formattedDate = `${dd}-${mm}-${yyyy}`;
  const filename = `Humres DCM - ${dcmType} - ${formattedDate}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
