import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// All ticket data from Raas Rodeo 2026 show
type Row = {
  fn: string; ln: string
  email: string | null; phone: string | null
  team: 'bu' | 'gt' | 'illini' | 'ucla' | 'ucsd' | 'utd' | 'uva' | 'washu' | null
  paid: boolean; pickedup: boolean; notes?: string
}

const SEED: Row[] = [
  // BU Fatakada
  { fn: 'Mayank', ln: 'Mohta', email: null, phone: '4699278393', team: 'bu', paid: true, pickedup: false },
  { fn: 'Ipsa', ln: 'Prusty', email: null, phone: '4696471140', team: 'bu', paid: true, pickedup: false, notes: 'Ticket transferred from Dhavasri Rajesh' },
  { fn: 'Dipti', ln: 'Shah', email: null, phone: '7326889773', team: 'bu', paid: true, pickedup: true },
  { fn: 'Manya', ln: 'Shah', email: null, phone: '4694002716', team: 'bu', paid: true, pickedup: true },
  { fn: 'Hemal', ln: 'Shah', email: null, phone: '7322616455', team: 'bu', paid: true, pickedup: true },
  { fn: 'Manya', ln: 'Sharma', email: null, phone: '7328535293', team: 'bu', paid: true, pickedup: true },
  { fn: 'Amit', ln: 'Fadia', email: 'amfadia@gmail.com', phone: '5204053001', team: 'bu', paid: true, pickedup: false },
  // GT Ramblin' Raas
  { fn: 'Mili', ln: 'Fadia', email: 'parikh.m723@gmail.com', phone: '7708810678', team: 'gt', paid: true, pickedup: false },
  { fn: 'Bhaskar', ln: 'Jain', email: 'bhaskar.picky@gmail.com', phone: '7325209363', team: 'gt', paid: true, pickedup: true },
  { fn: 'Hetal', ln: 'Patel', email: 'hetal904@gmail.com', phone: '6306564960', team: 'gt', paid: true, pickedup: true },
  { fn: 'Shital', ln: 'Patel', email: 'shitalp80@gmail.com', phone: '7049744274', team: 'gt', paid: true, pickedup: true },
  { fn: 'Parita', ln: 'Patel', email: 'parita2000@hotmail.com', phone: '9547017274', team: 'gt', paid: true, pickedup: true },
  { fn: 'Parita', ln: 'Patel', email: 'parita2000@hotmail.com', phone: '9547017274', team: 'gt', paid: true, pickedup: false },
  { fn: 'Puraj', ln: 'Patel', email: 'poori.patel@gmail.com', phone: '7703313546', team: 'gt', paid: true, pickedup: false },
  { fn: 'Archana', ln: 'Pradhan', email: 'pathareria23@gmail.com', phone: '9788066930', team: 'gt', paid: true, pickedup: true },
  { fn: 'Sejal', ln: 'Purandare', email: 'pathareria23@gmail.com', phone: '4087691096', team: 'gt', paid: true, pickedup: true },
  // Illini Raas
  { fn: 'Kajal', ln: 'Patel', email: 'patelkaj66@gmail.com', phone: '8478584222', team: 'illini', paid: true, pickedup: true },
  { fn: 'Marcus', ln: 'Metsala', email: 'marcusmetsala@utexas.edu', phone: '6825579820', team: 'illini', paid: false, pickedup: false },
  { fn: 'Ronak', ln: 'Jain', email: 'ronakdhelaria@gmail.com', phone: '6825820331', team: 'illini', paid: false, pickedup: false },
  // Public
  { fn: 'Saanavi', ln: 'Shah', email: 'saanavi.s.shah@gmail.com', phone: '4692337908', team: null, paid: true, pickedup: true },
  { fn: 'Gauri', ln: 'Nukala', email: 'gaurignukala@gmail.com', phone: '4693523122', team: null, paid: true, pickedup: true, notes: 'picked up at door' },
  { fn: 'Saketh', ln: 'Bhupathiraju', email: 'bhsaketh@gmail.com', phone: '9084622457', team: null, paid: true, pickedup: true },
  { fn: 'Aaveg', ln: 'Bhattacharya', email: 'kusum_nair@yahoo.com', phone: '5124226398', team: null, paid: true, pickedup: true, notes: 'Paid but Says Kusum Nair ticket' },
  { fn: 'Rajarshi', ln: 'Bhattacharya', email: 'rbhattu@gmail.com', phone: '5129242594', team: null, paid: true, pickedup: true },
  { fn: 'Richa', ln: 'Tripathi', email: 'richtri77@gmail.com', phone: '7372287530', team: null, paid: true, pickedup: true },
  { fn: 'Dhruv', ln: 'Tripathi', email: 'dhruvpt@yahoo.com', phone: '5126321421', team: null, paid: true, pickedup: true },
  { fn: 'Aesha', ln: 'Tripathi', email: 'richtri77@gmail.com', phone: '7372287530', team: null, paid: true, pickedup: true },
  { fn: 'Suhas', ln: 'Aleti', email: 'bhsaketh@gmail.com', phone: '9084622457', team: null, paid: true, pickedup: true },
  { fn: 'Khushi', ln: 'Thakkar', email: 'kthakk1234@gmail.com', phone: '6306072512', team: null, paid: true, pickedup: true },
  { fn: 'Savita', ln: 'Hira', email: 'hirasavita@yahoo.com', phone: '5124315464', team: null, paid: true, pickedup: true },
  { fn: 'Aarushi', ln: 'Shah', email: 'ashah007@gmail.com', phone: '2149459464', team: null, paid: false, pickedup: false, notes: 'Refunded' },
  { fn: 'Aditi', ln: 'Govil', email: 'aditigovil06@gmail.com', phone: '9724000913', team: null, paid: true, pickedup: true },
  { fn: 'Alyena', ln: 'Gilani', email: 'alyenagilani@gmail.com', phone: '9722156730', team: null, paid: true, pickedup: true },
  { fn: 'Atmik', ln: 'Das', email: 'atmikdas@gmail.com', phone: '9252090397', team: null, paid: true, pickedup: true },
  { fn: 'Avi', ln: 'Kapadia', email: 'kapadia.avi@gmail.com', phone: '6789793101', team: null, paid: true, pickedup: true },
  { fn: 'Rekha', ln: 'Patel', email: 'bhavkpatel@yahoo.com', phone: '2815138253', team: null, paid: true, pickedup: true },
  { fn: 'Danielle', ln: 'Donato', email: 'daniellemdonato@gmail.com', phone: '4158252645', team: null, paid: true, pickedup: true },
  { fn: 'Jai', ln: 'Doshi', email: 'jai.t.doshi@gmail.com', phone: '7049961166', team: null, paid: true, pickedup: false },
  { fn: 'Lalit', ln: 'Bhimanadam', email: 'lbhimanadham@gmail.com', phone: '4256521910', team: null, paid: true, pickedup: true },
  { fn: 'Nilisha', ln: 'Banepali', email: 'nilishabanepali@gmail.com', phone: '6822447335', team: null, paid: true, pickedup: false },
  { fn: 'Ojaswee', ln: 'Chaudhary', email: 'ojasweec@gmail.com', phone: '5103780250', team: null, paid: true, pickedup: true },
  { fn: 'Parul', ln: 'Gupta', email: 'parulg428@utexas.edu', phone: '9258609065', team: null, paid: true, pickedup: false },
  { fn: 'Shubhankari', ln: 'Sinha', email: 'prakritsinha2023@gmail.com', phone: '4252402529', team: null, paid: true, pickedup: false, notes: 'Paid through Tisha' },
  { fn: 'Rohan', ln: 'Parikh', email: 'raparikh10@gmail.com', phone: '4692158065', team: null, paid: true, pickedup: true },
  { fn: 'Ryan', ln: 'Dehle', email: 'ryans1735@gmail.com', phone: '9718086155', team: null, paid: true, pickedup: true },
  { fn: 'Bharti', ln: 'Bhakta', email: 'siapatel2134@gmail.com', phone: '5405330752', team: null, paid: true, pickedup: true },
  { fn: 'Nandini', ln: 'Patel', email: 'siapatel2134@gmail.com', phone: '5405330752', team: null, paid: true, pickedup: true },
  { fn: 'Ketan', ln: 'Patel', email: 'siapatel2134@gmail.com', phone: '5405330752', team: null, paid: true, pickedup: true },
  { fn: 'Sia', ln: 'Patel', email: 'siapatel2134@gmail.com', phone: '5405330752', team: null, paid: true, pickedup: true },
  { fn: 'Akshat', ln: 'Shah', email: 'akshatshah@utexas.edu', phone: '2018874914', team: null, paid: true, pickedup: true },
  { fn: 'Sona', ln: 'Bhavsar', email: 'Ami622@gmail.com', phone: '5127969388', team: null, paid: true, pickedup: true },
  { fn: 'Zara', ln: 'Bhavsar', email: 'Ami622@gmail.com', phone: '5127969388', team: null, paid: true, pickedup: true },
  { fn: 'Bobby', ln: 'Bhavsar', email: 'Ami622@gmail.com', phone: '5127969388', team: null, paid: true, pickedup: true },
  { fn: 'Ami', ln: 'Vaghani', email: 'Ami622@gmail.com', phone: '5127969388', team: null, paid: true, pickedup: true },
  { fn: 'Chhagan', ln: 'Vaghani', email: 'Ami622@gmail.com', phone: '5127969388', team: null, paid: true, pickedup: true },
  { fn: 'Ananya', ln: 'Nath', email: 'ananyatnath@gmail.com', phone: '6157529960', team: null, paid: true, pickedup: true },
  { fn: 'Anusha', ln: 'Dharia', email: 'dhariaanusha07@gmail.com', phone: '6307439607', team: null, paid: true, pickedup: true },
  { fn: 'Armin', ln: 'Momin', email: 'arminmomin@gmail.com', phone: '8329929162', team: null, paid: true, pickedup: false },
  { fn: 'Arun', ln: 'Tailor', email: 'tailor.arun@outlook.com', phone: '4804108081', team: null, paid: true, pickedup: true },
  { fn: 'Bhavesh', ln: 'Patel', email: 'bhavkpatel@yahoo.com', phone: '2815138253', team: null, paid: true, pickedup: true },
  { fn: 'Margo', ln: 'Guilbert', email: 'daniellemdonato@gmail.com', phone: '4159665328', team: null, paid: true, pickedup: true },
  { fn: 'Dhruval', ln: 'Patel', email: 'dhruvalpatel724@gmail.com', phone: '2246559046', team: null, paid: true, pickedup: true },
  { fn: 'Rajetha', ln: 'Balan', email: 'rjbalan2001@yahoo.com', phone: '2144998029', team: null, paid: true, pickedup: false, notes: 'Director Ticket' },
  { fn: 'Rajesh', ln: 'Balan', email: 'rlbalan@gmail.com', phone: '2145669145', team: null, paid: true, pickedup: false, notes: 'Director Ticket' },
  { fn: 'Sugatan', ln: 'Malode', email: 'sugsam2k@yahoo.com', phone: '2695192860', team: null, paid: false, pickedup: false, notes: 'Director Ticket' },
  { fn: 'Richaa', ln: 'Rajesh', email: 'rlbalan@gmail.com', phone: '2142893105', team: null, paid: true, pickedup: false, notes: 'Director Ticket' },
  { fn: 'Rishaan', ln: 'Rajesh', email: 'rlbalan@gmail.com', phone: '2145669145', team: null, paid: true, pickedup: false, notes: 'Director Ticket' },
  { fn: 'Jessica', ln: 'Meeks', email: 'meekjess18@gmail.com', phone: '5034386324', team: null, paid: true, pickedup: true },
  { fn: 'Karan', ln: 'Shah', email: 'karanxshah@gmail.com', phone: '6306171665', team: null, paid: true, pickedup: true },
  { fn: 'Kaustubh', ln: 'Kondapalli', email: 'kausth10@gmail.com', phone: '7089160609', team: null, paid: true, pickedup: false },
  { fn: 'Kisha', ln: 'Patel', email: 'patelkisha21@gmail.com', phone: '9565215864', team: null, paid: true, pickedup: true },
  { fn: 'Lekha', ln: 'Panati', email: 'klpanati@gmail.com', phone: '7204722169', team: null, paid: true, pickedup: false },
  { fn: 'Murali', ln: 'Devanaboyina', email: 'mdevanaboyina057@gmail.com', phone: '4023216862', team: null, paid: true, pickedup: true },
  { fn: 'Ria', ln: 'Desai', email: 'riaadesaii@gmail.com', phone: '7327633676', team: null, paid: true, pickedup: false },
  { fn: 'Rishi', ln: 'Patel', email: 'rishipatel264@gmail.com', phone: '4439662553', team: null, paid: true, pickedup: false },
  { fn: 'Shritika', ln: 'Rao', email: 'shritika.rao@gmail.com', phone: '5714667030', team: null, paid: true, pickedup: false },
  { fn: 'Soham', ln: 'Bhansali', email: 'sohambhansali@gmail.com', phone: '7372030472', team: null, paid: true, pickedup: true },
  { fn: 'Sarah', ln: 'Chesley', email: 'sschesley@gmail.com', phone: '4086008713', team: null, paid: true, pickedup: true },
  { fn: 'Jay', ln: 'Lesny Drake', email: 'jlesny17@gmail.com', phone: '8058161751', team: null, paid: true, pickedup: true },
  { fn: 'Tiffany', ln: 'Chen', email: 'chenatiffany@gmail.com', phone: '5138865858', team: null, paid: true, pickedup: false },
  { fn: 'Rahul', ln: 'Shah', email: 'rah.v.shah@gmail.com', phone: '8328677671', team: null, paid: true, pickedup: true },
  { fn: 'Amit', ln: 'Chhatbar', email: 'chhatbar.amit@gmail.com', phone: '4698795899', team: null, paid: false, pickedup: false, notes: 'Director Ticket' },
  { fn: 'Jigna', ln: 'Chhatbar', email: 'chhatbar.amit@gmail.com', phone: '4698795899', team: null, paid: false, pickedup: false, notes: 'Director Ticket' },
  // UCLA
  { fn: 'Nikita', ln: 'Mehta', email: 'nikita.mehta@yahoo.com', phone: '8189740047', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Sunil', ln: 'Mehta', email: 'sdmehta21@gmail.com', phone: '8189740082', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Rima', ln: 'Shah', email: 'rimanishah@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Manish', ln: 'Shah', email: 'rimanishah@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Mona', ln: 'Sheth', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Niraj', ln: 'Sheth', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Raina', ln: 'Sheth', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Shobha', ln: 'Butala', email: 'rimanishah@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Pradyumna', ln: 'Butala', email: 'rimanishah@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Dipa', ln: 'Mehta', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Shilpa', ln: 'Patel', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Suril', ln: 'Patel', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Sanam', ln: 'Patel', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Nirav', ln: 'Mehta', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Govind', ln: 'Butala', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Anissa', ln: 'Patel', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Ansh', ln: 'Mehta', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Aarav', ln: 'Mehta', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Miloni', ln: 'Patel', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Pratik', ln: 'Patel', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Maya', ln: 'Patel', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Milan', ln: 'Patel', email: 'monabutala@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Maheshwari', ln: 'Shah', email: 'rimanishah@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  { fn: 'Naresh', ln: 'Shah', email: 'rimanishah@hotmail.com', phone: '8324980346', team: 'ucla', paid: true, pickedup: true },
  // UCSD Raas Ruckus
  { fn: 'Aditi', ln: 'Gandhi', email: 'aditee.gandhi@gmail.com', phone: '4087442955', team: 'ucsd', paid: true, pickedup: false },
  { fn: 'Sumeru', ln: 'Kulkarni', email: 'mukund.vk@gmail.com', phone: '3522132854', team: 'ucsd', paid: true, pickedup: true },
  { fn: 'Roopa', ln: 'Kulkarni', email: 'mukund.vk@gmail.com', phone: '3522132854', team: 'ucsd', paid: true, pickedup: true },
  { fn: 'Shresta', ln: 'Kulkarni', email: 'mukund.vk@gmail.com', phone: '3522132854', team: 'ucsd', paid: true, pickedup: true },
  { fn: 'Mukund', ln: 'Kulkarni', email: 'mukund.vk@gmail.com', phone: '3522132854', team: 'ucsd', paid: true, pickedup: true },
  // UTD TaRaas
  { fn: 'Sonal', ln: 'Patel', email: 'sonal.patel1222@gmail.com', phone: '9728227076', team: 'utd', paid: true, pickedup: true },
  { fn: 'Dulari', ln: 'Patel', email: 'dulari.patel@gmail.com', phone: '9727417354', team: 'utd', paid: true, pickedup: true },
  { fn: 'Kirti', ln: 'Sinha', email: 'prakritsinha2023@gmail.com', phone: '4252402529', team: 'utd', paid: true, pickedup: false },
  { fn: 'Prateek', ln: 'Sushil', email: 'prakritsinha2023@gmail.com', phone: '5084103783', team: 'utd', paid: true, pickedup: false },
  { fn: 'Deepa', ln: 'Sirsi', email: 'sudhir.ramakrishna@gmail.com', phone: '7327130535', team: 'utd', paid: true, pickedup: true },
  { fn: 'Abigal', ln: 'Parsons', email: 'srinidhi.vraghavan@gmail.com', phone: '4697486923', team: 'utd', paid: true, pickedup: false, notes: 'Transferred from Gayathri' },
  { fn: 'Sudhir', ln: 'Ramakrishna', email: 'sudhir.ramakrishna@gmail.com', phone: '7327130535', team: 'utd', paid: true, pickedup: true },
  { fn: 'Shivani', ln: 'Kumar', email: 'shivani.r.kumar03@gmail.com', phone: '4696427101', team: 'utd', paid: true, pickedup: true },
  { fn: 'Ankit', ln: 'Shah', email: 'aanshishah023@gmail.com', phone: '2149459464', team: 'utd', paid: true, pickedup: true },
  { fn: 'Sonali', ln: 'Chauhan', email: 'aanshishah023@gmail.com', phone: '2149459464', team: 'utd', paid: true, pickedup: true },
  { fn: 'Pragya', ln: 'Singh', email: 'srinidhi.vraghavan@gmail.com', phone: '4697486923', team: 'utd', paid: true, pickedup: false, notes: 'Transferred from Vijaya' },
  { fn: 'Vikas', ln: 'Patel', email: 'ayushreepatel@gmail.com', phone: '6207140202', team: 'utd', paid: true, pickedup: true },
  { fn: 'Purvi', ln: 'Patel', email: 'ayushreepatel@gmail.com', phone: '6203306610', team: 'utd', paid: true, pickedup: true },
  { fn: 'Sharm', ln: 'Patel', email: 'sharmpatel@yahoo.com', phone: '2039829267', team: 'utd', paid: true, pickedup: true },
  { fn: 'Purvick', ln: 'Patel', email: 'ayushreepatel@gmail.com', phone: '6207140502', team: 'utd', paid: true, pickedup: true },
  { fn: 'Nitin', ln: 'Patel', email: 'sharmpatel@yahoo.com', phone: '2039829267', team: 'utd', paid: true, pickedup: true },
  { fn: 'Aashi', ln: 'Prasad', email: 'sumankunal@gmail.com', phone: '8186674809', team: 'utd', paid: true, pickedup: false },
  { fn: 'Suman', ln: 'Sahu', email: 'sumankunal@gmail.com', phone: '8186674809', team: 'utd', paid: true, pickedup: true },
  { fn: 'Shailee', ln: 'Gupta', email: 'srinidhi.vraghavan@gmail.com', phone: '4697486923', team: 'utd', paid: true, pickedup: true, notes: 'Transferred from Sandhya S' },
  { fn: 'Aryaa', ln: 'Shah', email: 'aryaashah10@gmail.com', phone: '4695141422', team: 'utd', paid: true, pickedup: false },
  { fn: 'Raji', ln: 'Vasudevan', email: 'srinidhi.vraghavan@gmail.com', phone: '4697486923', team: 'utd', paid: true, pickedup: false },
  { fn: 'Kunal', ln: 'Prasad', email: 'sumankunal@gmail.com', phone: '8186674809', team: 'utd', paid: true, pickedup: false },
  { fn: 'Priya', ln: 'Haridas', email: 'priyam2426@gmail.com', phone: '9728542488', team: 'utd', paid: true, pickedup: true },
  { fn: 'Bhuvana', ln: 'Haridas', email: 'priyam2426@gmail.com', phone: '9728542488', team: 'utd', paid: true, pickedup: true },
  { fn: 'Prem', ln: 'Kalam', email: 'premkalam@gmail.com', phone: '6146070292', team: 'utd', paid: true, pickedup: true },
  { fn: 'Rishil', ln: 'Uppaluru', email: 'rishil.u@gmail.com', phone: '5125219355', team: 'utd', paid: true, pickedup: true },
  { fn: 'Shloka', ln: 'Ojha', email: 'shloka1010@gmail.com', phone: '4083269816', team: 'utd', paid: true, pickedup: false },
  { fn: 'Krisha', ln: 'Nashte', email: 'krisha.nashte.629@gmail.com', phone: '4696184225', team: 'utd', paid: true, pickedup: false },
  { fn: 'Jaya', ln: 'Patel', email: 'dipanpatelll@gmail.com', phone: '9362328316', team: 'utd', paid: true, pickedup: true },
  { fn: 'Hina', ln: 'Patel', email: 'dipanpatelll@gmail.com', phone: '9362328316', team: 'utd', paid: true, pickedup: true },
  { fn: 'Jaanvi', ln: 'Patel', email: 'dipanpatelll@gmail.com', phone: '9362328316', team: 'utd', paid: true, pickedup: true },
  { fn: 'Meher', ln: 'Shah', email: 'manojshah79@gmail.com', phone: '2817141028', team: 'utd', paid: true, pickedup: false },
  { fn: 'Sarika', ln: 'Shah', email: 'manojshah79@gmail.com', phone: '2817141028', team: 'utd', paid: true, pickedup: true },
  { fn: 'Manoj', ln: 'Shah', email: 'manojshah79@gmail.com', phone: '2817141028', team: 'utd', paid: true, pickedup: true },
  { fn: 'Sunil', ln: 'Dusa', email: 'saanvirajulu@gmail.com', phone: '4699204884', team: 'utd', paid: true, pickedup: true },
  { fn: 'Swetha', ln: 'Dusa', email: 'saanvirajulu@gmail.com', phone: '4699204884', team: 'utd', paid: true, pickedup: true },
  { fn: 'Saadhvi', ln: 'Dusa', email: 'saanvirajulu@gmail.com', phone: '4697405757', team: 'utd', paid: true, pickedup: true },
  { fn: 'Dipan', ln: 'Patel', email: 'dipanpatelll@gmail.com', phone: '9362328316', team: 'utd', paid: true, pickedup: true },
  { fn: 'Hymavati', ln: 'Bikki', email: 'b.hymavati@gmail.com', phone: '5129178857', team: 'utd', paid: true, pickedup: false },
  { fn: 'Hima', ln: 'Kabira', email: 'gapkab@yahoo.com', phone: '9726586928', team: 'utd', paid: true, pickedup: true },
  { fn: 'Parimal', ln: 'Kabira', email: 'gapkab@yahoo.com', phone: '9726586928', team: 'utd', paid: true, pickedup: true },
  { fn: 'Adithya', ln: 'Kabira', email: 'gapkab@yahoo.com', phone: '9726586928', team: 'utd', paid: true, pickedup: true },
  { fn: 'Kajal', ln: 'Kantaria', email: 'diya.kantaria@gmail.com', phone: '4699887756', team: 'utd', paid: true, pickedup: false },
  { fn: 'Krish', ln: 'Kantaria', email: 'diya.kantaria@gmail.com', phone: '4699887756', team: 'utd', paid: true, pickedup: false },
  { fn: 'Jay', ln: 'Kantaria', email: 'diya.kantaria@gmail.com', phone: '4699887756', team: 'utd', paid: true, pickedup: false },
  { fn: 'Prachi', ln: 'Gandhi', email: 'prachikgandhi1@gmail.com', phone: '8325865472', team: 'utd', paid: true, pickedup: true },
  { fn: 'Kartik', ln: 'Gandhi', email: 'prachikgandhi1@gmail.com', phone: '8328295730', team: 'utd', paid: true, pickedup: true },
  { fn: 'Ria', ln: 'Gandhi', email: 'prachikgandhi1@gmail.com', phone: '8328295730', team: 'utd', paid: true, pickedup: true },
  // UVA Hooraas
  { fn: 'Poorvi', ln: 'Shah', email: 'poorvishah@hotmail.com', phone: '7036187427', team: 'uva', paid: false, pickedup: false },
  { fn: 'Ankur', ln: 'Shah', email: 'poorvishah@hotmail.com', phone: '7036187424', team: 'uva', paid: false, pickedup: false },
  { fn: 'Deepa', ln: 'Shah', email: 'poorvishah@hotmail.com', phone: '7036187424', team: 'uva', paid: false, pickedup: false },
  { fn: 'Bansi', ln: 'Shah', email: 'poorvishah@hotmail.com', phone: '7036187424', team: 'uva', paid: false, pickedup: false },
  { fn: 'Sunita', ln: 'Shah', email: 'poorvishah@hotmail.com', phone: '7036187424', team: 'uva', paid: false, pickedup: false },
  // WashU Raas
  { fn: 'Srikanth', ln: 'Namburi', email: 'namburineha@gmail.com', phone: '9084324070', team: 'washu', paid: false, pickedup: false },
  { fn: 'Hasini', ln: 'Namburi', email: 'namburineha@gmail.com', phone: '9084324070', team: 'washu', paid: false, pickedup: false },
  { fn: 'Swathi', ln: 'Muvvala', email: 'namburineha@gmail.com', phone: '9084324070', team: 'washu', paid: false, pickedup: false },
]

const TEAM_MAP: Record<string, { name: string; ticket_allocation: number }> = {
  bu: { name: 'BU Fatakada', ticket_allocation: 20 },
  gt: { name: "GT Ramblin' Raas", ticket_allocation: 25 },
  illini: { name: 'Illini Raas', ticket_allocation: 20 },
  ucla: { name: 'UCLA Raas', ticket_allocation: 30 },
  ucsd: { name: 'UCSD Raas Ruckus', ticket_allocation: 20 },
  utd: { name: 'UTD TaRaas', ticket_allocation: 55 },
  uva: { name: 'UVA Hooraas', ticket_allocation: 20 },
  washu: { name: 'WashU Raas', ticket_allocation: 20 },
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = await createServiceClient()
  const { data: person } = await service.from('people').select('role_type').eq('email', user.email!).single()
  if (person?.role_type !== 'admin') return NextResponse.json({ error: 'Board only' }, { status: 403 })

  // Wipe placeholder data (preserve admin/board accounts)
  // Delete all tickets first (FK), then non-admin people, then all teams
  await service.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { data: nonAdmins } = await service
    .from('people')
    .select('id')
    .in('role_type', ['audience', 'competitor', 'captain', 'liaison', 'volunteer'])
  if (nonAdmins && nonAdmins.length > 0) {
    await service.from('people').delete().in('id', nonAdmins.map(p => p.id))
  }
  await service.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Insert the 8 real teams
  const teamInserts = Object.values(TEAM_MAP).map(t => ({
    name: t.name,
    ticket_allocation: t.ticket_allocation,
  }))
  const { data: insertedTeams, error: teamErr } = await service
    .from('teams')
    .insert(teamInserts)
    .select('id, name')
  if (teamErr) return NextResponse.json({ error: `Teams: ${teamErr.message}` }, { status: 500 })

  // Re-query teams to build id map (don't rely on insert response)
  const { data: allTeams } = await service.from('teams').select('id, name')
  const teamIdMap: Record<string, string> = {}
  for (const t of allTeams || []) {
    for (const [key, val] of Object.entries(TEAM_MAP)) {
      if (val.name === t.name) teamIdMap[key] = t.id
    }
  }

  if (Object.keys(teamIdMap).length === 0) {
    return NextResponse.json({ error: 'Team IDs could not be resolved after insert', teams: allTeams }, { status: 500 })
  }

  // Probe which ticket statuses the DB actually accepts
  const probeStatuses = ['paid', 'picked_up', 'reserved', 'assigned']
  const validStatuses = new Set<string>()
  for (const s of probeStatuses) {
    // Insert a throwaway ticket with a dummy UUID to test — expect FK error (person not found)
    // but if we get a CHECK constraint error we know the status is invalid
    const { error: probeErr } = await service.from('tickets').insert({
      person_id: '00000000-0000-0000-0000-000000000001',
      type: 'public', status: s,
    })
    // FK violation = status is valid; check constraint = status is invalid
    if (!probeErr || probeErr.code !== '23514') validStatuses.add(s)
  }

  // Map statuses to what the DB actually accepts
  function safeStatus(pickedup: boolean, paid: boolean): string {
    if (pickedup) return validStatuses.has('picked_up') ? 'picked_up' : 'paid'
    if (paid)     return 'paid'
    return validStatuses.has('reserved') ? 'reserved' : 'assigned'
  }

  // Insert people and tickets
  let inserted = 0
  const errors: string[] = []

  for (let i = 0; i < SEED.length; i++) {
    const row = SEED[i]
    const teamId = row.team ? teamIdMap[row.team] ?? null : null
    const role: string = (row.team && teamId) ? 'competitor' : 'audience'
    const type: string = (row.team && teamId) ? 'ff' : 'public'
    const position = 'Audience' // use valid position for all ticket holders
    const status = safeStatus(row.pickedup, row.paid)

    const email = `${row.fn.toLowerCase().replace(/\s+/g, '')}.${row.ln.toLowerCase().replace(/\s+/g, '')}.${i}@show.raasrodeo2026.internal`

    const { data: newPerson, error: pErr } = await service
      .from('people')
      .insert({
        first_name: row.fn,
        last_name: row.ln,
        email,
        phone: row.phone ?? null,
        role_type: role,
        position,
        team_id: (role === 'competitor') ? teamId : null,
      })
      .select('id')
      .single()

    if (pErr || !newPerson) {
      errors.push(`Person ${row.fn} ${row.ln}: ${pErr?.message}`)
      continue
    }

    const { error: tErr } = await service.from('tickets').insert({ person_id: newPerson.id, type, status })

    if (tErr) {
      errors.push(`Ticket ${row.fn} ${row.ln}: ${tErr.message}`)
    } else {
      inserted++
    }
  }

  return NextResponse.json({
    inserted,
    total: SEED.length,
    errors: errors.length > 0 ? errors : undefined,
    teams_created: insertedTeams?.length ?? 0,
    message: `Seeded ${inserted}/${SEED.length} tickets from Raas Rodeo 2026 show data.`,
  })
}
