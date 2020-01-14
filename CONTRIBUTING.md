# Table of Contents
- [Table of Contents](#table-of-contents)
- [Libraries and Technologies](#libraries-and-technologies)
- [Our Coding Philosophy](#our-coding-philosophy)
- [Coding Style](#coding-style)
- [Coding Practices](#coding-practices)

# Libraries and Technologies
1. [React](https://reactjs.org/docs/getting-started.html)
2. [react-hyperscript-helpers](https://github.com/Jador/react-hyperscript-helpers)
3. [Lodash/fp](https://gist.github.com/jfmengels/6b973b69c491375117dc)
4. [CircleCI](https://circleci.com/)
5. [yarn](https://yarnpkg.com/lang/en/)
 
# Our Coding Philosophy

We would like our contributors to understand the principles behind our code base. With this information we hope to make it easier for you to contribute and understand why we have made certain decisions in our code. As you read through the document you should see these philosophies emerge in our coding style and practices.

1. Write simple, easy to understand code
    * Simple does not mean easy, difficult problems can be coded with simplicity
    * This is difficult to do in practice, but we always strive for simple code

2. Ask why / what is the problem we are addressing?
    * Does it bring value to the user?
    * Just because we can do something, does that mean we should? Is it the right thing to do?
    * Are we solving an issue for the user, or completing a prescribed task?
    * Making sure we understand the problem as a whole, pushing back and getting clarification when it is not clearly understood
    
3. Don't be afraid to upset the status quo
    * **Is something hard to understand? Can it be done better? Do it!** This keeps tech debt down, the code base simple, easy to understand and work with.
    * Accepted or industry standard approaches have value and get us close to where we want to be, rethinking problems from first principles can spur innovation and deliver better results
    * The world around us is constantly changing and new solutions can present themselves when rethinking a problem
    * We accept this within our own codebase as well. If the rationale for doing something no longer holds, be willing to change it. "That is how we have always done it" is not a good rationale
  
4. Be willing to give and receive feedback
    * Being able to give and receive feedback is an excellent way to improve your skills as an individual and support the project

5. Usability and Accessibility are a high priority
    * Ensure our application is accessible so everyone can use it
    * Accessible applications tend to be more usable for all
    * Test how the users will interact with the application
  
6. Mentoring is an integral part of becoming a better engineer
    * The ability to explain and answer questions demonstrates greater understanding and exposes areas where you can improve
    * Ask questions! This helps you and the person explaining the answer solidify knowledge and exposes areas of confusion.

7. Keep the environment simple so the developer experience is painless
    * Use tools that keep the environment simple and straightforward to use
    * Provide clear error messages where appropriate

# Coding Style
1. We use react-hyperscript-helpers rather than JSX to keep our code base cleaner
     * Hyperscript helpers allows developers to remain in a javascript context rather than having to make a mental context switch to the JSX templating language while developing

2. Use Lodash/fp for data transformation and functional utility
     * fp is the functional programming variant of Lodash designed for better composability, immutability and auto currying built in
     * This allows us to keep the data simple and not tie the data or shape of the data directly into our UI components
  
3. Use functional instead of class components
     * Functional components better support our functional coding style 
     * Use react hooks instead of lifecycle methods in a functional component
       * If you need more custom behavior look at the code base for our custom hooks
       * All custom hooks will be prefixed with "use" (e.g. useOnMount)
       
4.  We style our site using inline styling. 
     * This keeps the styling close to the code allowing developers to easily add styles without having to switch contexts to CSS or another file
     * This also prevents developers from having to deal with CSS classes and side effects of the cascade

5. Be sure any components you add to the page have the appropriate aria-labels and keyboard accessibility

6. Destructure down to the most atomic property in most cases

7. Be mindful when using conditionals
    * Use reasonable default values when appropriate rather than using imperative code or conditionals 
    * We use [short circuit evaluation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators#Short-circuit_evaluation) for conditionals with a boolean result

8. We Prefer using constants over variables
    * Variables introduce additional state and potentially side effects into a function. This can make it difficult to reason about the code and potentially introduce bugs

9. We lint our code using our [ESLint rule set](https://github.com/DataBiosphere/terra-ui/blob/dev/.eslintrc.js)
    * Using an eslint plugin with our IDE will improve your developer experience when working with our codebase

# Coding Practices

1. Keeping code simple is easier said than done. 
     * Some General thoughts on simplicity to take into account when contributing code
       * Could someone else explain your code?
       * In a year from now will you still understand this code?
       * Did you have to use comments to clarify your code, or is it self explanatory?
       * Do your functions and components need to know implementation details of other functions and components?
       * Is the data decoupled sufficiently from the logic?

     * Concepts that can make your code simpler
       * Reduce the amount of state in your functions and component - what is the minimum state needed?
       * Ensure functions and components are single purpose
       * Avoid side effects
       * When you need to deal with side effects, use the right abstractions to make it clear we are dealing with a side effect (e.g using useEffect)
       * Make use of small, simple helper functions
       * Keep functions pure
       * Utilize our existing constructs (e.g. use withErrorHandling instead of using try/catch)

     * Concepts that will add complexity to your code
       * Adding a lot of state
       * Sharing state across components
       * Excessive branching / conditionals
       * Adding special cases
       * Using abstractions that are too powerful for the intended result 
         * e.g. using a sledgehammer to hang a picture
       * Premature optimizations 

2. Favor functional, declarative coding
    * Functional code that is side-effect free or has predictable effects is easier to reason about and test
    * This helps us keeping data separate from the application logic
    * We prefer to composable constructs such as wrappers (e.g. withErrorHandling) as opposed to imperative code
    * When the need for imperative code arises, make sure the coding style is clearly imperative (use if/else rather than ternary expressions)
    * Take advantage of currying where you can
 
3. Understand the problem
    * Before writing code, it is good to understand what value the change is bringing to the users
    * It is also good to understand the user flow - how the user uses the application to make sure we are providing the correct functionality rather than prescribed functionality
    * For example, a user may request making a data column wider so they can more easily copy and paste data
      * Diving deeper and asking why they want to copy data in the first place may yield more information, unveiling what the user actually wants vs. what they asked for

4. Feedback
    * We prefer slowing down and iterating several times on a PR to ensure the code is right and in line with our standards rather than quickly pushing code through
    * We emphasize a high level of code quality in our codebase to prevent technical debt and keep the application easy to develop
    * We encourage comments and discussion in PR's to release high quality, understandable code
    * To merge the code with our dev branch, at least 1 PR approval is needed


5. Do not be afraid to change existing code to make it easier to work with
    * If you find yourself trying to work around existing code think about what improvements could be 
      made to it rather then continuing on the workaround
    * Feel free to reach out to any member of the team if you are unsure of how to proceed before investing too much time
      into a solution - we love to help our contributors!
      
6. Release often
    * **Once code is merged to dev, it is considered production ready and deployable**
    * We release daily. Once you have merged your code it will be live in production around 10:00AM
    * A rapid release cycle helps us to keep our deployment process simple and allows to to rapidly fix issues as they arise