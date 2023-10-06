interface Event {
	event: string;
	minTeamSize: number;
	maxTeamSize: number;
	perChapter: number;
}

export const events: Event[] = [
	{
		event: 'Animation (Washington Only)',
		minTeamSize: 1,
		maxTeamSize: 4,
		perChapter: 3
	},
	{
		event: 'Animatronics*',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Architectural Design*',
		minTeamSize: 1,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Audio Podcasting*',
		minTeamSize: 1,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Biotechnology Design*',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Board Game Design*',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Career Prep* (Washington Only)',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Chapter Team',
		minTeamSize: 6,
		maxTeamSize: 6,
		perChapter: 2
	},
	{
		event: "Children's Stories*",
		minTeamSize: 1,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Coding',
		minTeamSize: 1,
		maxTeamSize: 2,
		perChapter: 3
	},
	{
		event: 'Computer-Aided Design (CAD), Architecture',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Computer-Aided Design (CAD), Engineering',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Concept Art (Washington Only)',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Data Science and Analytics*',
		minTeamSize: 1,
		maxTeamSize: 2,
		perChapter: 3
	},
	{
		event: 'Debating Technological Issues*',
		minTeamSize: 2,
		maxTeamSize: 2,
		perChapter: 2
	},
	{
		event: 'Digital Video Production*',
		minTeamSize: 1,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Dragster Design*',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Drone Challenge (UAV)*',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Engineering Design*',
		minTeamSize: 3,
		maxTeamSize: 6,
		perChapter: 5
	},
	{
		event: 'Essays on Technology',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 2
	},
	{
		event: 'Extemporaneous Speech',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 2
	},
	{
		event: 'Fashion Design and Technology*',
		minTeamSize: 2,
		maxTeamSize: 4,
		perChapter: 3
	},
	{
		event: 'Flight Endurance*',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Forensic Science',
		minTeamSize: 2,
		maxTeamSize: 2,
		perChapter: 3
	},
	{
		event: 'Future Technology Teacher*',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 2
	},
	{
		event: 'Geospatial Technology*',
		minTeamSize: 2,
		maxTeamSize: 3,
		perChapter: 3
	},
	{
		event: 'Infographic (Washington Only)',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Manufacturing Prototype*',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Music Production*',
		minTeamSize: 1,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'On Demand Video',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 1
	},
	{
		event: 'Photographic Technology',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Prepared Presentation*',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 2
	},
	{
		event: 'Promotional Design',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Robotic Challenge* (Washington Only)',
		minTeamSize: 2,
		maxTeamSize: 4,
		perChapter: 3
	},
	{
		event: 'Senior Solar Sprint*',
		minTeamSize: 2,
		maxTeamSize: 4,
		perChapter: 3
	},
	{
		event: 'Silent Film (Washington Only)',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 2
	},
	{
		event: 'Software Development*',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'STEM Mass Media (Washington Only)',
		minTeamSize: 2,
		maxTeamSize: 3,
		perChapter: 2
	},
	{
		event: 'Structural Design and Engineering*',
		minTeamSize: 2,
		maxTeamSize: 2,
		perChapter: 9999
	},
	{
		event: 'System Control Technology*',
		minTeamSize: 3,
		maxTeamSize: 3,
		perChapter: 1
	},
	{
		event: 'Technology Bowl',
		minTeamSize: 3,
		maxTeamSize: 3,
		perChapter: 1
	},
	{
		event: 'Technology Problem Solving',
		minTeamSize: 2,
		maxTeamSize: 2,
		perChapter: 2
	},
	{
		event: 'Transportation Modeling*',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 3
	},
	{
		event: 'Trebuchet (Washington Only)',
		minTeamSize: 2,
		maxTeamSize: 4,
		perChapter: 3
	},
	{
		event: 'VEX Robotics*',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Video Game Design*',
		minTeamSize: 2,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Virtual Reality Visualization (VR)*',
		minTeamSize: 1,
		maxTeamSize: 6,
		perChapter: 3
	},
	{
		event: 'Webmaster*',
		minTeamSize: 3,
		maxTeamSize: 5,
		perChapter: 1
	}
];
