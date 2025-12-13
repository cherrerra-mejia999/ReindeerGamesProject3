# Reindeer Games — Christmas Fifteen Puzzle

**Group Member:**
* Cristofer Herrera-Mejia
* Sophie Nguyen
* Karni Rathod

**Materials:**
* [Proposal]()
* [Slides]()
* [Website]()
* [Demo]

**Project Summary:**
* The project focuses on building an interactive Christmas-themed fifteen puzzle game called "Reindeer Games", featuring competitive gameplay, dynamic themes, achievement systems, and a progressive holiday narrative.
* Players solve sliding tile puzzles across multiple difficulty levels while unlocking unique achievements, utilizing strategic power-ups, and progressing through a 10-chapter Christmas story.

**Key Features:**
* **Authentication System:** User registration and login with secure password hashing, session management, and profile creation using PHP and MySQL.
* **Interactive Puzzle Board:** Responsive grid layout (3×3, 4×4, 5×5, 6×6) with smooth tile animations, move validation, win detection, and real-time move counter and timer display.
* **Dynamic Theme System:** Four Arctic-themed visual environments that adapt based on time of day and player performance, with localStorage persistence.
* **Achievement & Story System:** Reindeer-themed badges, progressive narrative chapters, and modal-based reward displays that enhance engagement.

**Functionalities:**

* **Core Game Features:**
   * **Competitive Game Modes:** Speed solving, fewest moves, and combo modes with global leaderboards and performance analytics.
   * **Session-Based Tracking:** PHP sessions maintain user authentication, game progress, and statistics across multiple puzzle sessions.
   * **Strategic Shuffling Algorithm:** Move-based puzzle generation ensures solvability while providing varying difficulty levels.
   * **Real-Time Validation:** JavaScript validates tile movements, calculates efficiency scores, and detects win conditions instantly.

* **Custom Undergraduate Features:**
   * **Adaptive Arctic Atmosphere System:** Four unique themes (Northern Lights, Santa's Workshop, Ice Palace, Candlelight Christmas) that automatically switch based on time of day or player performance metrics.
   * **Reindeer's Achievement Badges System:** Ten unique achievements named after Santa's reindeer (Rudolph, Dasher, Prancer, Vixen, Comet, Cupid, Donner, Blitzen, North Star Navigator, Arctic Explorer) with automatic detection and modal displays.
   * **Reindeer's Gift Power-ups:** Three strategic abilities with limited uses:
      * Reindeer Vision (3 uses): Calculates and highlights optimal moves using Manhattan distance pathfinding algorithm.
      * Santa's Helper (2 uses): Automatically executes the next three optimal moves with animated sequences.
      * North Pole Blizzard (1 use): Time dilation mechanic that slows game timer by 50% for 45 seconds.
   * **Santa's Lost Delivery Route Story:** Ten-chapter progressive narrative about restoring Santa's scrambled delivery map, with localStorage persistence and modal-based chapter reveals after each puzzle completion.

**Technology Stack:**
* **Frontend:** HTML5, CSS3 (Grid/Flexbox), Vanilla JavaScript (ES6+)
* **Backend:** PHP 7.4+, RESTful API design
* **Database:** MySQL 8.0 with normalized schema (7 tables, 3 views, 5 stored procedures)
* **Security:** Bcrypt password hashing, prepared statements, SQL injection prevention, XSS protection
* **Deployment:** GSU CODD Server (codd.cs.gsu.edu)

**Database Schema:**
* **Tables:** users, user_profiles, game_sessions, puzzle_configs, leaderboards, game_analytics, achievements
* **Views:** user_stats_view, leaderboard_view, recent_games_view
* **Security:** Foreign key constraints, indexed columns, prepared statements throughout






