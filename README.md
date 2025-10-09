# AI Postgres Access

[Main Implementation File](https://github.com/k1eu/ai-rawsql/blob/main/index.ts)

## Install 
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

Helpfull commands (will depend on your setup ofc, but in general youu need something like this):

```sql

-- base role - without inheritance
CREATE ROLE readonly NOINHERIT;

GRANT CONNECT ON DATABASE yourdatabasename TO readonly;

GRANT USAGE ON SCHEMA public TO readonly;

GRANT SELECT ON TABLE public.city TO readonly;
GRANT SELECT ON TABLE public.region TO readonly;
GRANT SELECT ON TABLE public.offer TO readonly;

```

- create an agent user in postgres and assign it this role

```sql
GRANT readonly TO agent;
```

- now any change to the `readonly` role in postgres will affect the agent possibilities

Other notes: 

- I used GPT-4o - but GPT-5 is cheaper and GPT-5-mini might be cheaper and still sufficient - need to be tested
- Remember that GPT-5 is much more vary of system prompots - so remember to be direct and not cofuse it / overload

- database discovery is a first tool right now - make sure to have `use discovery before any query`  in its description so it never hallucinates the queries
- Other idea would be to do the discovery even before calling an agent and prefilling the schema in the system prompt
- Or making the tool as a required first step in the agentic loop

- create views on top of the database - create the environemnt for the model not to fetch all data
- use postgres 18 - for async reads - great for agents
- ideally create read replica specifically for agents - no to overload the main database
