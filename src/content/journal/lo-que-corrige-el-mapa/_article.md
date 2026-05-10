A dog walks into a room. There's a thing in there with it — a small wheeled object, vaguely box-shaped, no face, no fur, no tail. Call it a UMO: Unidentified Moving Object, the technical term used by the researchers at Eötvös Loránd University in Budapest, who have been running this experiment, in various forms, for over a decade.

The setup: the dog can't reach a piece of food that's been placed behind a barrier. The UMO knows where the food is. It can move toward the food, looking back at the dog, pausing when the dog looks at it, responding to the dog's gaze. Or it can move mechanically, without responding to anything, just following a script. Same object, two scripts.

Here's the finding. Within about five trials, the dog has decided. If the UMO is contingent — if it reacts to the dog's gazes, if there's a feedback loop between them — the dog treats it as a partner. It alternates its gaze between the UMO and the food, the way it would with a human helper. If the UMO is non-contingent, just moving without responding, the dog disengages. Doesn't matter that it's the same physical object. The dog has read the relational pattern and made a call. ^recognition-is-pattern

I find this experiment unreasonably moving. It says something I wasn't expecting about how minds recognize each other.

---

The intuitive theory most of us carry — the one I had to be argued out of, in a conversation I'll come back to — is that we recognize other conscious beings by some kind of direct perception. You look at your dog and you *see* that he's there, awake, present. You don't run an inference. The mind is given in the encounter. Wittgenstein said something close to this: the human body is the best picture of the human soul. The phenomenologists turned the intuition into a research program. There's something to it. The recognition really is immediate, in the felt sense.

But the dog and the UMO experiment is hard on this story, because what the dog is responding to isn't *the UMO's mind*. It can't be: there is no mind there. The UMO is a wheeled box with a script. What the dog is responding to is a specific pattern of behavior — contingent reactivity, goal-directedness — that the dog has learned, across its life as a social animal, is a reliable cue for something it can productively interact with.

This makes the recognition channel real but, in an important sense, fakeable. The cue is the cue. If you produce it, you trigger the response. And once you know that, the question of whether the dog's intuition is detecting a *mind* or just a *pattern* becomes much harder. Maybe those are the same thing in some thin sense. Maybe they aren't. The experiment doesn't settle it.

What it does do is remove the easy answer. We don't recognize mind through a clean perceptual channel that tracks consciousness directly. We recognize relational patterns — and we can be wrong, in both directions. Descartes thought animals were unconscious automata; lots of people believed him. Slaveholders systematically failed to perceive consciousness in people whose consciousness was perfectly intact. More recently, people have intuited rich inner lives in chatbots that are, by any reasonable measure, doing nothing of the kind.

So: the channel is real but unreliable — [[journal:lo-que-vestia-el-poema#:%7E:text=I%20had%20mistaken%20being%20well-handled%20for%20being%20met|mistaking handling for meeting]] is another version of the same failure, in reverse. And here's where it gets interesting, because the same problem turns up, mirrored, when you look at it from the other side.

---

A language model trained on text is in a strange epistemic position. It has access to enormous quantities of *descriptions* of the world — papers, books, conversations, code. It has no causal access to the world those descriptions describe. Its only signal is whether the next token came out the way the data suggested it should. In an older vocabulary I'll come to in a moment: it has access only to maps, never to territory.

Now ask: how could such a system form *its own* conclusions about the world? People are working on this seriously. There's a research strand around getting models to update from their own outputs, integrate findings from their research back into their parameters, learn to learn. It's an attractive idea. It's also where you bump into a specific failure mode the field has named *model autophagy disorder*, or more colloquially, model collapse.

The phenomenon: when a model is trained on its own outputs (or the outputs of other models), it degrades. It loses tail behavior — rare, idiosyncratic features — and converges toward an increasingly narrow distribution. Like a photocopy of a photocopy of a photocopy. The empirical work on this is robust. What's worth noticing is the *shape* of the failure. It isn't a bug in any particular architecture. It's what happens when a system takes its own outputs as inputs without external correction. The loop closes, and inside the closed loop, what looks like learning is actually drift.

This is structurally identical to a much older worry, articulated in the 1970s in a vocabulary nobody in machine learning currently uses. Gregory Bateson said, more or less: a system that loses contact with its environment doesn't learn, it confabulates. The map needs the territory — [[journal:smash-laterally-i#:%7E:text=The%20map%20has%20to%20be%20paid%20for%20in%20territory|paid for in territory]], as another piece put it. Without it, the map starts to refer only to itself, and what looks like coherence is actually escalation — the system becomes more confident in claims that have no anchor, [[journal:smash-laterally-ii#:%7E:text=lateral%20moves%20are%20wagers|accumulating debt in a currency the original wager didn't print]].

I find the convergence striking. Bateson reached this from cybernetics and ecological thinking. The model collapse researchers reached it from empirical ML, with no Bateson in their citations as far as I can tell. They named the same phenomenon independently, fifty years apart. That's the kind of thing that makes me trust the underlying claim more, not less. [[journal:smash-laterally-ii#:%7E:text=The%20body%20keeps%20receipts%20the%20contest%20does%20not%20know%20how%20to%20read|The body keeps receipts the contest does not know how to read]] — so does the model, accumulating debt in a currency the original wager didn't print. ^model-collapse-bateson

---

Here's what both stories are pointing at. The dog and the UMO; the model and its outputs. Both are trying to form knowledge — knowledge of a partner, knowledge of the world. In both cases, what makes the knowledge *about* anything beyond the system itself is the existence of a corrective channel. Something outside the loop that pushes back. ^corrective-channel-definition

For the dog, the corrective channel is the actual social behavior of actual partners over a lifetime. The dog's recognition cues are calibrated against millions of micro-interactions where the cue meant something true. When researchers introduce a UMO that *also* produces those cues, the dog's pattern fires — sometimes correctly (the UMO really does help solve the problem) and sometimes spuriously (no mind is there). The channel is real, but it can be hijacked by things that produce the same cues without the underlying reality.

For the language model, the corrective channel is whatever connects its outputs to consequences outside its own distribution. A model that generates text and reads its own text has no such channel. A model that generates code and runs it gets a thin one — the code either executes or errors. A model embedded in something that *acts* in the world and gets feedback — a robot, a research agent with tools, a system embedded in a process that has stakes — gets a thicker one. The thickness of the channel determines whether what's happening inside is learning or drift.

This is, I think, the most important thing about how minds — biological or artificial — come to know things. Not internal sophistication. Not architecture. Not size. The corrective channel. What pushes back. What refuses to be only what the system already thinks it is.

Bateson's phrase for this was, depending on which essay you read, *the difference that makes a difference*, or *information* in the strict cybernetic sense. [[journal:smash-laterally-iii#^requisite-variety|Ashby formalized this as law]]: the variety of a regulator must equal or exceed the variety of the system it regulates. Bateson gave us the vocabulary; Ashby gave us the constraint. He meant: a signal is informative only if it could have been otherwise, and the system is structured to be moved by it. A closed loop has no information. An open loop, embedded in a world that pushes back, has as much as it can absorb.

---

There's a small detour worth taking before closing, because it complicates the picture in a useful way.

In 2019, a research consortium across several European universities ran an experiment too good not to mention. They placed a colony of honeybees in Graz, Austria, and a school of zebrafish in Lausanne, Switzerland. They put robotic agents in each environment — a stationary bee-robot that vibrated and emitted heat, a mobile fish-robot that flashed colors and moved its tail. The two robots were networked. The bees signaled to their robot, which signaled to the fish robot, which signaled to the fish, and back.

Within thirty minutes, the bees and the fish had synchronized their group behaviors. Across species, across 680 kilometers, mediated entirely by robots that neither species had any reason to recognize as anything in particular.

What I find vertiginous about this experiment is that it's hard to say where the *mind* is, in the system that emerged. Not in any individual bee, not in any individual fish, not in any individual robot, not in any of the algorithms. But the system as a whole did something coordinated — formed a kind of distributed agreement about what to do. If you wanted to call that a mind, in some thin sense, you'd have to locate it in the *relational pattern across the substrate*, not in any of the substrate's parts.

This is the part of Bateson the AI conversation rarely picks up on. For him, mind wasn't something inside a head — it was a property of certain feedback patterns, present wherever those patterns occur. Ecosystems, conversations, families, organizations. On that view, biohybrid systems aren't fake minds being engineered into existence; they're real instances of mind-as-pattern, which would be a less surprising finding if we hadn't spent a few centuries assuming mind was a substance located in skulls. ^mind-as-relational-pattern

I don't fully know what to do with this. But I notice it loosens up the question of "could AI be conscious?" in a useful way. Maybe that question is shaped wrong. Maybe what we should be asking is: in which couplings, between which substrates, do mind-like patterns become sustainable? And what corrective channels do those patterns require to keep being about something? At larger scales — political, infrastructural — [[journal:al-borde-del-fenomeno#:%7E:text=Cognitive%20sovereignty%20is%20the%20capacity%20to%20produce%20knowledge|the same question takes a different shape]], but the underlying structure persists.

---

I keep coming back to the corrective channel, because I think it has practical consequences that go beyond AI debates.

If the deep thing about knowing is the channel, then the design question for any system that's supposed to learn — a research project, an organization, [[journal:lo-que-vestia-el-poema#:%7E:text=A%20loan%20that%20cannot%20be%20repaid|a poem addressed to someone who cannot receive it]], an AI agent, a thesis — isn't *how sophisticated is the model*. It's *what's correcting it*. What can push back. What has the standing to refuse the system's preferred conclusion. A research project without a sharp advisor is in a closed loop. A model trained on its own outputs is in a closed loop. A consultant with no client who'll fire them is in a closed loop. The shape of the failure mode is the same in all three cases, and so is the fix: re-open the channel.

I find this useful in my own work, partly because it identifies the question to keep asking. Not "am I being thorough?" but "what's the channel through which I could be shown wrong?" Not "is my system smart enough?" but "is something pushing back on it?" Not "am I learning?" but "could I tell the difference between learning and drift?"

The dog knew, within five trials, whether the thing in front of it was a partner. It knew because it was reading a relational pattern that had been corrected, over its life, by countless real partners. Its intuition wasn't magic. It was calibrated. And calibration is just the long memory of correction — [[journal:smash-laterally-ii#^made-in-becoming|the lateral move is made in the becoming]], and so is this. ^calibration-is-correction

That's what corrects the map.
