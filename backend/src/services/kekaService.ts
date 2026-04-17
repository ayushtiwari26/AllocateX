/**
 * Keka HRMS Integration Service
 * -----------------------------
 * Syncs employees from Keka into AllocateX.
 *
 * When KEKA_API_BASE_URL + KEKA_API_TOKEN env vars are set, this service
 * hits the live Keka endpoint (`/v1/hris/employees`). Otherwise it falls back
 * to a bundled snapshot of the IT department roster so local demos work.
 *
 * The bundled snapshot is the exact payload the customer shared with us for
 * the `IT` department (59 employees across Bangalore + Ahmedabad).
 */

import axios from 'axios';

export interface KekaEmployee {
    id: number;
    identifier: string;
    displayName: string;
    email: string;
    employeeNumber: string;
    workPhone: string | null;
    mobilePhone: string | null;
    profileImageUrl: string | null;
    parentDepartmentName: string | null;
    businessUnitId: number;
    businessUnit: string | null;
    departmentId: number;
    department: string;
    jobtitle: string;
    secondaryJobTitle: string | null;
    locationName: string;
}

export interface KekaPage {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    items: KekaEmployee[];
}

// Snapshot from Keka (IT department, both pages combined).
// Used when live credentials aren't configured.
const KEKA_SNAPSHOT: KekaEmployee[] = [
    { id: 1198747, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'A Madhwaraj', email: 'madhwaraj.a@gembaconnect.in', employeeNumber: 'HRM469', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/43c700aeb6fc43b18c4be9468e815bfe.jpeg?639032079688398522', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Senior QA Engineer', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 683571, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Ajay Rajpurohit', email: 'ajay.r@gembaconnect.in', employeeNumber: 'HRM183', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/e8baeb8aa8e24bab8e4b533d72da79b6.png', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Tech Consultant', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1032960, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Ankit Singh', email: 'ankitsingh@gembaconnect.in', employeeNumber: 'HRM365', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Devops Engineer', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 854794, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Arjunsingh Devisingh Purohit', email: 'arjunsingh.p@gembaconnect.in', employeeNumber: 'HRM255', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/d38be5abefff4d4ba191c8242aabc42f.jpg', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1203367, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Ashish Kumar', email: 'ashishkumar@gembaconcepts.com', employeeNumber: 'HRM473', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/a28190c332044e05bb6d4294282ed115.jpg?639083921900698723', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Business Analyst', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1181704, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Ashish Kumar Shukla', email: 'ashish.s@gembaconnect.in', employeeNumber: 'HRM461', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Business Analyst', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1050979, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Ayush Srivastava', email: 'ayushsrivastava@gembaconnect.in', employeeNumber: 'HRM391', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/71e783d4c89e4a13a747ab7aaf6bfea0.jpeg?638862731707754945', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1050938, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Ayush Tiwari', email: 'ayush.t@gembaconnect.in', employeeNumber: 'HRM387', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/bc32207677a24a93aad19c310e02e6d1.jpg?638864242726874887', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer-I', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1088062, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Battina Manohar Reddy', email: 'manohar.b@gembaconnect.in', employeeNumber: 'HRM419', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 858935, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Brijesh Atulbhai Pankhaniya', email: 'brijesh.a@gembaconnect.in', employeeNumber: 'HRM257', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/db7ebb543d6a40a98af49e883d414e2e.jpg', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer-I', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1114048, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'D Dinesh', email: 'dinesh.d@gembaconnect.in', employeeNumber: 'HRM435', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/9dc42f52a66542a2a48455305586a7cf.jpg?638931645449765070', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Test Engineer', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1113490, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'D N Bhavana', email: 'bhavana.d@gembaconnect.in', employeeNumber: 'HRM434', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Test Engineer', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1147051, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Deepak S R', email: 'deepak.sr@gembaconnect.in', employeeNumber: 'HRM440', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/bf763dbc25644e8c938f62ecd8bf7f88.jpeg?639030231598840708', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Senior Business Analyst', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1062594, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Deepprabha', email: 'deepprabha@gembaconnect.in', employeeNumber: 'HRM400', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/33e99c72b62a44468431806a753c3c46.jpeg?638967385477896862', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1116974, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Dharani Korla', email: 'dharani.k@gembaconnect.in', employeeNumber: 'HRM437', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Test Engineer', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1169772, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Divya Agarwal', email: 'divya.a@gembaconnect.in', employeeNumber: 'HRM453', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Tech Lead', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 899241, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Hardik Vala', email: 'hardik.v@gembaconnect.in', employeeNumber: 'HRM287', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/48a174223b464fd0985f2dede6b2d939.jpg?638965609733005194', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Senior UI/UX Designer', secondaryJobTitle: null, locationName: 'Ahmedabad' },
    { id: 1020468, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Harshit Om Soni', email: 'harshit.s@gembaconnect.in', employeeNumber: 'HRM357', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/2f189ddbb15e4d218586cb5f784d8877.jpg?639032992882915400', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1203337, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Himanshi Goyal', email: 'himanshi.g@gembaconnect.in', employeeNumber: 'HRM471', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Ahmedabad' },
    { id: 1097252, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Honnurgowda S', email: 'itsupport@gembaconcepts.com', employeeNumber: 'HRM428', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'IT Support Executive', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 865738, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Indra Jit Singh', email: 'indra.s@gembaconnect.in', employeeNumber: 'HRM263', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/4bc6fc56c3a449349c874cc42538ea07.jpg?639075338534847404', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1166003, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'J Shashank Reddy', email: 'shashank.j@gembaconnect.in', employeeNumber: 'HRM446', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Jr. Business Analyst', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 980326, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Kaja Naga Karthik', email: 'karthik.k@gembaconnect.in', employeeNumber: 'HRM320', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1076379, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Kalma Nikul', email: 'nikul.k@gembaconnect.in', employeeNumber: 'HRM413', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Ahmedabad' },
    { id: 1163933, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Katte Bhargavi', email: 'bhargavi.k@gembaconnect.in', employeeNumber: 'HRM445', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/3d7f4948a6b8461c9fea02dcefb4f99e.jpeg?639041391959045759', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Ticketing Support Executive', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1114055, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Koduru Venkatesh', email: 'venkatesh.k@gembaconnect.in', employeeNumber: 'HRM436', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/22a31ab7a36f4938950dd47bc8a0ef71.jpg?638935272552921874', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Test Engineer', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1050975, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Kotadiya Darshan Anilbhai', email: 'darshan.k@gembaconnect.in', employeeNumber: 'HRM390', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer-I', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1050953, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Lekkakula Srinivas Teja', email: 'srinivas.l@gembaconnect.in', employeeNumber: 'HRM388', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/eea710c18c5842cb88b831620ef98d1e.jpeg?638864266210541538', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer-I', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1020443, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Manankumar Rakeshbhai Patel', email: 'manan.p@gembaconnect.in', employeeNumber: 'HRM356', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 962247, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Manila Vaswani', email: 'manila.v@gembaconnect.in', employeeNumber: 'HRM311', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/f2cd1955af734d31b3beec34e6a8722c.jpeg', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Tech Lead', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1040657, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Marshiya Sahil Goverdhan', email: 'sahil@gembaconnect.in', employeeNumber: 'HRM374', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 940451, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Mayank Singhania', email: 'mayank.s@gembaconnect.in', employeeNumber: 'HRM300', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1169482, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Nipun', email: 'nipun.s@gembaconnect.in', employeeNumber: 'HRM448', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE - 2', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1062603, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Nithin Chilumula', email: 'nithin.c@gembaconnect.in', employeeNumber: 'HRM401', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/a134b2143e4449eaa09992465db5d25c.jpeg?639046076570687203', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1243460, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Piyush Raj', email: 'piyush.raj@gembaconnect.in', employeeNumber: 'HRM524', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE - 2', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1050959, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Prajapati Chiragi Chandrakant', email: 'chiragi.p@gembaconnect.in', employeeNumber: 'HRM389', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer-I', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 863589, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Pranav Bansal', email: 'pranav.b@gembaconnect.in', employeeNumber: 'HRM261', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 739562, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Prashant Gautam', email: 'prashant.g@gembaconnect.in', employeeNumber: 'HRM200', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1071550, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Pratham Jain KB', email: 'pratham.j@gembaconnect.in', employeeNumber: 'HRM402', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1008493, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Rahul Annarao Khadake', email: 'rahul.k@gembaconnect.in', employeeNumber: 'HRM352', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer-I', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1041405, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Rahul Mahesh Soni', email: 'rahul.m@gembaconnect.in', employeeNumber: 'HRM376', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1039546, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Rakesh Kumar Thakur', email: 'rakesh.k@gembaconnect.in', employeeNumber: 'HRM373', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/9ac9b8cb1c5b40ef8ab3a61b3ed4ecb5.jpg?639099485527828766', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1214720, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Ramya G Joshi', email: 'ramya.j@gembaconnect.in', employeeNumber: 'HRM486', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Ticketing Support Executive', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1185144, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Rishabh Kumar', email: 'rishabh.k@gembaconnect.in', employeeNumber: 'HRM462', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/c1d3c21cefee42c797c24bccd4518943.jpeg?639032297831949145', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Business Analyst', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1058404, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Ritika John Fargose', email: 'ritika.f@gembaconnect.in', employeeNumber: 'HRM395', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/4e736ee12e6541a8b544740514f4b236.jpg?638935506067140326', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1050917, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Rohit Mahajan', email: 'rohit.m@gembaconnect.in', employeeNumber: 'HRM386', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1254713, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Rupesh Kumar', email: 'rupesh.k@gembaconnect.in', employeeNumber: 'HRM534', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE - 2', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1254756, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Saikiran G', email: 'saikiran.g@gembaconnect.in', employeeNumber: 'HRM535', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Business Analyst', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 863586, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Sanjay S', email: 'sanjay.s@gembaconnect.in', employeeNumber: 'HRM260', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 806433, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Sanket Prakash', email: 'sanket.p@gembaconnect.in', employeeNumber: 'HRM234', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/657f97e227d64949ac0cc132493d4b39.jpg', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1001930, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Shahbaz Alam', email: 'shahbaz.a@gembaconnect.in', employeeNumber: 'HRM349', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer-I', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1163910, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Subha Chatterjee', email: 'subha.c@gembaconnect.in', employeeNumber: 'HRM444', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/71520acf01ef405da14aea44b3019336.jpg?639032040197835490', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE - 2', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 859006, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Tandel Umang Champakbhai', email: 'umang.t@gembaconnect.in', employeeNumber: 'HRM258', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/ab7fec91ab26449591a495340626b78b.jpg', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer-I', secondaryJobTitle: null, locationName: 'Ahmedabad' },
    { id: 1093325, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Tanmaykumar Rajubhai Patel', email: 'tanmay.p@gembaconnect.in', employeeNumber: 'HRM425', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1071561, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Vaghadiya Pooja Himatbhai', email: 'pooja.v@gembaconnect.in', employeeNumber: 'HRM404', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Software Development Engineer - II', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1166130, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Vani Gupta', email: 'vani.g@gembaconnect.in', employeeNumber: 'HRM447', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/6e01f01318874392835c94ec2495d50a.jpeg?639099314695761451', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'Front-End Developer', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 746530, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Varnika Singh', email: 'varnika.s@gembaconnect.in', employeeNumber: 'HRM214', workPhone: null, mobilePhone: null, profileImageUrl: null, parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE 1', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 1203362, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Vishal Vijay Suvarna', email: 'vishal.s@gembaconnect.in', employeeNumber: 'HRM472', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/2ea97926ac1b4b4dbc3fff7c50cdcc4d.jpeg?639038083475817732', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE - 2', secondaryJobTitle: null, locationName: 'Bangalore' },
    { id: 813434, identifier: '00000000-0000-0000-0000-000000000000', displayName: 'Zalak Thakor', email: 'zalak.t@gembaconnect.in', employeeNumber: 'HRM241', workPhone: null, mobilePhone: null, profileImageUrl: 'profileimage/fe29d3c2072947f288cb9541232e473f.jpeg?638871155162842155', parentDepartmentName: null, businessUnitId: 269453, businessUnit: null, departmentId: 181665, department: 'IT', jobtitle: 'SDE - 2', secondaryJobTitle: null, locationName: 'Ahmedabad' },
];

const KEKA_BASE = process.env.KEKA_API_BASE_URL; // e.g. https://app.keka.com/api/v1
const KEKA_TOKEN = process.env.KEKA_API_TOKEN;

export const kekaService = {
    isLiveConfigured(): boolean {
        return Boolean(KEKA_BASE && KEKA_TOKEN);
    },

    /** Fetch all employees across pages. Uses live API when configured, else snapshot. */
    async fetchAllEmployees(): Promise<KekaEmployee[]> {
        if (!kekaService.isLiveConfigured()) {
            return KEKA_SNAPSHOT;
        }

        const all: KekaEmployee[] = [];
        let page = 1;
        let totalPages = 1;
        do {
            const { data } = await axios.get<KekaPage>(`${KEKA_BASE}/hris/employees`, {
                headers: { Authorization: `Bearer ${KEKA_TOKEN}` },
                params: { pageNumber: page, pageSize: 100 },
                timeout: 20000,
            });
            all.push(...(data.items ?? []));
            totalPages = data.totalPages ?? 1;
            page += 1;
        } while (page <= totalPages);
        return all;
    },

    /** Derive role from Keka job title. */
    deriveRole(jobtitle: string): 'admin' | 'manager' | 'team_lead' | 'employee' {
        const t = jobtitle.toLowerCase();
        if (t.includes('consultant')) return 'manager';
        if (t.includes('tech lead') || t.includes('team lead')) return 'team_lead';
        if (t.startsWith('senior') || t.includes('senior ')) return 'team_lead';
        return 'employee';
    },

    /** Derive a sub-team (within IT) from job title. */
    deriveTeam(jobtitle: string): string {
        const t = jobtitle.toLowerCase();
        if (t.includes('devops')) return 'DevOps';
        if (t.includes('qa') || t.includes('test')) return 'Quality Engineering';
        if (t.includes('business analyst')) return 'Business Analysis';
        if (t.includes('ui') || t.includes('ux') || t.includes('front-end') || t.includes('frontend')) return 'Frontend & Design';
        if (t.includes('support') || t.includes('ticketing')) return 'IT Support';
        return 'Software Engineering';
    },

    /** Split displayName into first + last, keeping remainder in lastName. */
    splitName(displayName: string): { firstName: string; lastName: string } {
        const parts = displayName.trim().split(/\s+/);
        if (parts.length === 1) return { firstName: parts[0], lastName: '' };
        return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    },

    KEKA_SNAPSHOT,
};

export default kekaService;
