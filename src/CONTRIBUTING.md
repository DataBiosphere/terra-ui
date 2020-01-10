## Table of Contents

- [Libraries and Technologies](#libraries-and-technologies)
  - [React](#react)
  - [react-hyperscript-helpers](#react-hyperscript-helpers)
  - [Lodash/fp](#lodashfp)
    - [Helpful Links](#helpful-links)
  - [CircleCI](#circleci)
- [Our Coding Philosophy](#our-coding-philosophy)
- [Coding Style](#coding-style)
- [Coding Practices](#coding-practices)
- [Miscellany](#miscellany)
- [Deployment Cycle (Other Tips)](#deployment-cycle-other-tips)

# Libraries and Technologies
## React
What is React?
React is a Javascript library for building user interfaces. 

Why do we use React?
React has simple and elegant API's that allow us to easily componentize pieces of our application without prescribing how applications should be written.
  
[React](https://reactjs.org/docs/getting-started.html)
## react-hyperscript-helpers
[react-hyperscript-helpers](https://github.com/Jador/react-hyperscript-helpers)
## Lodash/fp
### Helpful Links
[Lodash/fp API's](https://gist.github.com/jfmengels/6b973b69c491375117dc)

## CircleCI
# Our Coding Philosophy
1. Write simple, easy to understand code
   * Simple does not mean easy, difficult problems can be coded with simplicity
   * This is difficult to do in practice, but we always strive for simple code

2. Don't be afraid to upset the status quo
  * Aaccepted or industry standard approaches have value and get us close to where we want to be, rethinking problems from first principles can spur innovation and deliver better results
  * The world around us is constantly changing and new solutions can present themselves when rethinking a problem
  * We accept this within our own codebase as well. If the rationale for doing something no longer holds, be willing to change it. "That is how we have always done it" is not a good rationale

3. Release Often
  * Release small iterable chunks of functionality with low risk 
  * Makes it easier to find and fix issues when they arise
  * Daily releases
  * Fast fixes to bugs found in the wild
  * promotion from dev to prod is fast
  
4. Be willing to give and receive feedback
  * Being able to give and receive feedback is an excellent way to improve your skills as an individual and support the team
  

5. Ask why / what is the problem we are addressing?
  * Just because we can do something, does that mean we should? Is it the right thing to do?
  * Are we solving an issue for the user, or completing a prescribed task?
  * Making sure we understand the problem as a whole, pushing back and getting clarification when it is not clearly understood
  
6. Is something hard to understand? Can it be done better? Do it!
  * This keeps tech debt down, the code base simple, easy to understand and work with
  * This can be rolled in with development minded
  
7. The developer experience should be ejoyable
   * Use tools that keep the environment simple and easy to use
   * Provide clear error messages where appropriate
  
8. Write tests baed on how the users will interact with the application
  * Have the tests focus on how a user will use the application rather than unit tests
9. Use the least powerful abstraction to complete the job
  * Using switchcase instead of cond where applicable
  * Using map flatten + map rather reduce / breaking things out into smaller and easier to understand chunks
  * Safer to use the lesser abstraction, less chance of things going wrong
  * The intent of the code is clearer and more precise with simpler abstractions
10. Usability and A11y
  * Use aria labels
  * Ensure our application is accessible so everyone can use it
  * Accessible applications tend to be more usable for all
  
# Coding Style

* Avoid using let (never use var) prefer using const instead (functional coding)
  * Using let introduces additional state and potentially side effects into a function. This can make it diffcult to reason about the code and potentially introduce bugs

* Use Lodash/fp for data transformation and functional utility (functiona coding)
  * fp is the functional programming variant of Lodash designed for better composability and currying
  * Deals with collections in many cases instead of arrays
  * Lodash will auto curry functions
  * Examples: map, filter, flow
* Destructure down to the most atomic property in most cases (simple, easy to understand, avoids access to mutable objects)
* Use reasonable default values when appropriate rather than using imperative code or conditionals (simple, easy to understand)
* Try to reduce the overall amount of state required by your code (simple, easy to understand)
  * Be mindful of how much state (breadth) is being managed in the code
  * Avoid setting complex state (depth) prefer simple states
* Use functional instead of class components (functional coding)
  * Functional components better support our functional coding style 
  * Use react hooks instead of lifecycle methods in a functional component
    * If you need more custom behavior look at the code base for our custom hooks
    * All custom hooks will be prefixed with "use" (e.g. useOnMount)
* We use react-hyperscript-helpers rather than JSX to keep our code base cleaner (status quo)
  * Hyperscript helpers allows developers to remain in a javascript context rather than having to make a mental context switch to the JSX templating language while developing
*  We style our site using inline styling. This keeps the styling close to the code allowing developers to easily (Simple code)
  add styles without having to switch contexts to CSS or another file
  * This also prevents developers from having to deal with css classes and the cascade
* We have a daily release cycle (Release often)
  * We use CircleCI to run our tests and deploy our code
  * Once code has been merged in with our dev branch it will be deployed at approximately 10:30AM the following day
* We tend to iterate on the code in our PR cyle. (Handling Feedback)
  * We emphasize a high level of code quality in our codebase to prevent technical debt and keep the application easy to develop
  * We prefer slowing down and iterating several times on a PR to ensure the code is right and in line with our standards rather than
  quickly pushing code through
  * We encourage comments and discusssion in PR's to release high quality, understandable code
* 

# Coding Practices

1. Keeping it simple
  * Functional decomposition
  * Can you easily explain your code?
 * Could someone else explain your code?
 * In a year from now will you still understand this code?
 * Simple code alleviates the need for comments which can easily become stale
 * See Rich Hickey's Simple made easy
 5. Finding the right abstractions
  * We try to make our code easy to understand by providing useful abstractions to help simplify what we are trying to do

6. ...At the right time
  * Avoid premature optimization
  * Create the right abstractions at the right time
  * Avoid gold plating
    * More description for this term if we keep it
  * When it makes sense (repeating code / pattern, cleaning up code)

2. Favor functional, declarative coding
  * Functional code that is side-effect free or has predictable effects is easier to reason about
  * Easier to test
  * Easier to understand
  * Using lodash
  * Keeping data concerns separate from the application
  * Using wrappers (e.g. withErrorHandling)
  * Making composable components and functions
  * Using currying where applicable

3. Status Quo  
  * CSS Variables
  * Hyperscript
  * No Taxonomy
  * Quality approach
  * React Hooks
  * Daily releases
4. Feedback
  * Quality over speed
  * PR cycle, at least 1 approval is needed
  * Keeping the codebase at a high level of craftsmanship will prevent us from taking on technical debt and pushing problems down the road
  
8. Understanding the problem
  * Finding value to bring to the users
  * ex. Widening of columns because the user asked for it

# Miscellany
* firecloud & workspace are not camelcased
   
# Deployment Cycle (Other Tips)