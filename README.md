# AIDEP-Tubitak
About AIDEP (AI Disaster Emergency Platform)
AIDEP is a highly scalable, two-phase disaster management architecture engineered to resolve critical logistical bottlenecks during the crucial 6-72 hours post-disaster. Moving beyond traditional passive data collection platforms, AIDEP's core system logic is deeply focused on dynamic road damage detection and safe route optimization.

Built on a high-performance FastAPI backend and PostgreSQL/PostGIS database, the platform leverages a sophisticated 3-stage AI pipeline to automate crisis response:

Real-time Infrastructure Analysis (YOLOv8): Processes user and geo-tagged visual data to detect, classify, and map road blockages and building damage.

Algorithmic Prioritization (XGBoost): Evaluates incoming distress signals against multiple dynamic parameters (urgency, weather, YOLO-derived damage scores) to calculate precise priority scores.

Resilient Routing & Matching (Enhanced Greedy + OSRM): Bypasses YOLO-identified hazardous zones to calculate the safest possible routes, optimally dispatching volunteers and resources using the Open Source Routing Machine engine.

The client-side architecture features a cross-platform mobile application built with React Native and TypeScript for field operations, alongside a React web panel for institutional monitoring and pre-disaster simulation drills.
