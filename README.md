# ai-rls-test

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.


## Notes

- create readonly role in postgres
- craete an agent user in postgres and assign it this role
- create views on top of the database - create the environemnt for the model not to fetch all data
- ideally create read replica specifically for agents - no to overload the main database
- use postgres 18 - for async reads - great for agents
