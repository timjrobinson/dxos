# CRM

## Background

Customer relationship management (CRM) is about tracking customer conversations and relationships such that a team of people can efficiently process those customers through a workflow or a sequence of lifecycle stages.

Many CRM solutions exist out there, including ones integrated into Microsoft Office, Tencent WeChat, and Salesforce, but they are mostly expensive, centralized, and closed-source. 

We think there is further value unlocked when the CRM implementation integrates tightly with other essential KW scenarios in the same app such as:
  - internal and external chat and messaging
  - recruiting pipeline management
  - document authoring and content management
  - product support and feedback systems
  - custom automations possible through the extensibility model we provide

## User Stories

These are unique, cross-app scenarios we aim to differentiate with:

### 1. Rich Mentions in Chat

An entity from the CRM or recruiting pipeline can be mentioned by name in internal team chat. 
  - Their name becomes a simple link to the record which can be navigated
  - Their name pops an overlay or unfurls into an inline info card to help avoid context switching
  - The "interactions" listing is automatically updated with every internal mention of the customer
  - Unfurled cards about customer relationships can have context-aware actions on them:
    - send an email
    - send a discord message
    - open last conversation thread
    - move record to a different state/status/stage

### 2. Creating CRM records from Chat

Any names or contact information along with relevant context can be extracted from a message (or group of selected messages) which were dragged from a chat conversation into the appropriate "customers" table or "state" column in a kanban view of the table. This creates (or merges with) any necessary entries in the customers table and adds the relevant context as interaction records.

### 3. Creating CRM records from GitHub contacts

Any github contributors visualized in the Composer UI can be dragged into the relevant customers folder, or relevant state in a kanban view of the customers table, which creates (or merges with) relevant records, metadata, and interactions in the CRM.



---

- Users can create Spaces containing multiple Tables that display records of a given Schema.
- Objects associated with a given Schema can be created, viewed, and manipulated by Tables and Kanban.
- Teams can create Spaces from templates:
  - The CRM template contains definitions for Organization, Project, and Person schema.
  - The Recruiting template contains definitions for Interview and Pipeline schema.
- Users enter records in the Projects table.
- The GitHub Sourcing Function crawls and updates Person records associated with each Project.
- Users drag Person records into the Pipeline kanban.
- Users can enter Interview feedback by creating a form (Card).
- The set of Interview forms can be views as a Stack associated with the Candidate.


## Issues

- Sharing schema across Spaces.
- Cross-space references.
- Lenses.
- Access control.


## Components

### Table

- Tables are a primary View component type that displays a collection of objects based off of a user-customizable query.
- The Table plugin can be used to create a new Schema and/or configure the View from an existing Schema.
- The Table metadata includes layout information (e.g., column width) and View configuration (e.g., sort, filter).
- Table columns types include: numbers (floats, integers), strings (simple and markdown text), booleans, dates, constrained values (enums), attachments (e.g., IPFS files), and references (singular or sets).
- Table cells containing references can be updated via a type-ahead component that matches records from the referenced data set (e.g., Schema type).
- Tables may be virtualized to enable large (> 1000 object) collections.
- Table rows can be re-ordered via drag-and-drop.
- Table rows can be dragged to or from other containers.
- Table rows can be inserted and deleted. A "hanging-edit" table row is always visible at the bottom of the table to enable quickly adding records.
- Table rows can be selected.
- Tables can be embedded within Stacks.

### Kanban

- Kanbans a kind of View component that displays a collection of objects based off of a user-customizable query.
- Kanbans can be optionally associated with a Schema.
- Objects are represented by generic cards that can interpret the Schema associated with each object (e.g., title/content, image).
- Cards can be re-ordered and moved between columns via drag-and-drop.
- Cards can be dragged to or from other containers.

### Chat

- Each View can be displayed alongside a Chat.
- Chat messages will have access to the View (and selection state) as a context.
- Chat messages may include reference to View objects, which are represented via Cards that can be dragged and dropped into Views.

### Inbox

- The Inbox is a custom tabular representation of Message objects.
